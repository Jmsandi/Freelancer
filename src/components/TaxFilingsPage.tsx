import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Eye, Trash2, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface TaxFiling {
  id: string;
  tax_year: number;
  total_income: number;
  total_deductions: number;
  taxable_income: number;
  calculated_tax: number;
  status: string;
  filed_at: string | null;
  pdf_report_url: string | null;
  created_at: string;
}

export default function TaxFilingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filings, setFilings] = useState<TaxFiling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFilings();
    }
  }, [user]);

  const fetchFilings = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_filings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFilings(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tax filings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = (filing: TaxFiling) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const marginLeft = 15;
    const marginTop = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - marginLeft * 2;

    const formatNLe = (n: number) => `NLe${(n || 0).toLocaleString()}`;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Tax Filing Report', marginLeft, marginTop);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const generatedAt = format(new Date(), 'MMM dd, yyyy HH:mm');
    doc.text(`Generated: ${generatedAt}`, pageWidth - marginLeft - 55, marginTop);

    // Subheader / Jurisdiction
    doc.setFontSize(12);
    doc.text('Sierra Leone PAYE Summary', marginLeft, marginTop + 8);

    // Taxpayer Information Box
    let y = marginTop + 18;
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, y, contentWidth, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Taxpayer Information', marginLeft + 2, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tax Year: ${filing.tax_year}`, marginLeft + 2, y + 12);
    if (user) {
      const nameOrEmail = (user.user_metadata?.full_name as string) || user.email || '';
      doc.text(`Taxpayer: ${nameOrEmail}`, marginLeft + 70, y + 12);
    }
    doc.text(`Status: ${filing.status}`, marginLeft + 2, y + 18);
    const created = format(new Date(filing.created_at), 'MMM dd, yyyy');
    const filed = filing.filed_at ? format(new Date(filing.filed_at), 'MMM dd, yyyy') : '-';
    doc.text(`Created: ${created}`, marginLeft + 70, y + 18);
    doc.text(`Filed: ${filed}`, marginLeft + 130, y + 18);

    // Summary Table
    y += 30;
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', marginLeft, y);
    y += 4;

    const rowHeight = 8;
    const col1 = marginLeft;
    const col2 = marginLeft + contentWidth / 2;

    const drawRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label, col1, y);
      doc.text(value, col2, y, { align: 'left' });
      y += rowHeight;
    };

    doc.setDrawColor(230);
    doc.line(marginLeft, y - 2, marginLeft + contentWidth, y - 2);

    drawRow('Total Income', formatNLe(filing.total_income));
    drawRow('Total Deductions', formatNLe(filing.total_deductions));
    drawRow('Taxable Income', formatNLe(filing.taxable_income));

    doc.setFont('helvetica', 'bold');
    drawRow('Calculated Tax (PAYE)', formatNLe(filing.calculated_tax));

    // Notes
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(
      'Note: Deductions may include standard deduction and statutory pension (NASSIT) where applicable.',
      marginLeft,
      y
    );
    y += 5;
    doc.text('All amounts shown in New Leones (NLe).', marginLeft, y);
    doc.setTextColor(0);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      'This document was generated electronically and is valid without a signature.',
      marginLeft,
      footerY
    );
    doc.setTextColor(0);

    doc.save(`tax-filing-${filing.tax_year}.pdf`);
  };

  const handleFile = async (filingId: string) => {
    try {
      const { error } = await supabase
        .from('tax_filings')
        .update({ 
          status: 'filed',
          filed_at: new Date().toISOString()
        })
        .eq('id', filingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax filing submitted successfully"
      });

      fetchFilings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to file tax return",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (filingId: string) => {
    try {
      const { error } = await supabase
        .from('tax_filings')
        .delete()
        .eq('id', filingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax filing deleted successfully"
      });

      fetchFilings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tax filing",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'filed':
        return <Badge variant="default">Filed</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading tax filings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filings.filter(f => f.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filed Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filings.filter(f => f.status === 'filed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Year Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              NLe{filings
                .filter(f => f.tax_year === new Date().getFullYear())
                .reduce((sum, f) => sum + f.calculated_tax, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Filings Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax Filings
              </CardTitle>
              <CardDescription>Manage your tax return filings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No tax filings found</h3>
              <p>Use the Tax Calculator to create your first tax filing.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Income</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Tax Owed</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filings.map((filing) => (
                  <TableRow key={filing.id}>
                    <TableCell className="font-medium">{filing.tax_year}</TableCell>
                    <TableCell>{getStatusBadge(filing.status)}</TableCell>
                    <TableCell>NLe{filing.total_income.toLocaleString()}</TableCell>
                    <TableCell>NLe{filing.total_deductions.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      NLe{filing.calculated_tax.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(filing.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {filing.filed_at ? 
                        format(new Date(filing.filed_at), 'MMM dd, yyyy') : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {filing.status === 'draft' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleFile(filing.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            File
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Download PDF"
                          onClick={() => generatePdf(filing)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {filing.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(filing.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Filing Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>Filing Status Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Status Definitions:</h4>
              <ul className="space-y-1 text-sm">
                <li><strong>Draft:</strong> Tax return calculated but not yet filed</li>
                <li><strong>Filed:</strong> Tax return submitted to tax authorities</li>
                <li><strong>Accepted:</strong> Tax return accepted and processed</li>
                <li><strong>Rejected:</strong> Tax return rejected and needs corrections</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Important Notes:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Review all calculations before filing</li>
                <li>• Keep records of all supporting documents</li>
                <li>• Filed returns cannot be modified</li>
                <li>• Contact support for filing issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}