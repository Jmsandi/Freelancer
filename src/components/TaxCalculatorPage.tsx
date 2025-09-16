import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calculator, FileText, TrendingUp } from 'lucide-react';
import { calculateProgressiveTax } from '@/lib/taxEngine';

interface TaxRule {
  id: string;
  tax_year: number;
  income_bracket_min: number;
  income_bracket_max: number | null;
  tax_rate: number;
  standard_deduction: number;
}

interface TaxCalculation {
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  taxOwed: number;
  effectiveRate: number;
  marginalRate: number;
  statutoryPension?: number;
  standardDeduction?: number;
  additionalDeductions?: number;
  deductionsCapped?: boolean;
  uncappedDeductions?: number;
}

export default function TaxCalculatorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    taxYear: '2024',
    grossIncome: '',
    additionalDeductions: ''
  });

  useEffect(() => {
    fetchTaxRules();
  }, []);

  const fetchTaxRules = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_rules')
        .select('*')
        .eq('tax_year', parseInt(formData.taxYear))
        .order('income_bracket_min');

      if (error) throw error;
      setTaxRules(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tax rules",
        variant: "destructive"
      });
    }
  };

  const calculateTax = async () => {
    setLoading(true);
    
    try {
      const grossIncome = parseFloat(formData.grossIncome) || 0;
      const additionalDeductions = parseFloat(formData.additionalDeductions) || 0;
      
      // Get standard deduction from tax rules
      const standardDeduction = taxRules[0]?.standard_deduction || 13850; // 2024 standard deduction
      const result = calculateProgressiveTax({
        grossIncome,
        additionalDeductions,
        standardDeduction,
        brackets: taxRules,
        statutoryPensionRatePercent: 5, // Sierra Leone NASSIT employee contribution (5%)
      });

      setCalculation({
        grossIncome,
        deductions: result.deductions,
        taxableIncome: result.taxableIncome,
        taxOwed: result.taxOwed,
        effectiveRate: result.effectiveRate,
        marginalRate: result.marginalRate,
        statutoryPension: result.statutoryPension,
        standardDeduction,
        additionalDeductions,
        deductionsCapped: result.deductionsCapped,
        uncappedDeductions: result.uncappedDeductions,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate tax",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTaxFiling = async () => {
    if (!calculation || !user) return;
    
    try {
      const { error } = await supabase
        .from('tax_filings')
        .insert([{
          user_id: user.id,
          tax_year: parseInt(formData.taxYear),
          total_income: calculation.grossIncome,
          total_deductions: calculation.deductions,
          taxable_income: calculation.taxableIncome,
          calculated_tax: calculation.taxOwed,
          status: 'draft'
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tax calculation saved as draft filing"
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save tax filing",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTaxRules();
  }, [formData.taxYear]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tax Calculator Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Calculator
            </CardTitle>
            <CardDescription>
              Calculate your estimated tax liability based on current tax brackets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxYear">Tax Year</Label>
              <Select
                value={formData.taxYear}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, taxYear: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="grossIncome">Gross Annual Income (NLe)</Label>
              <Input
                id="grossIncome"
                type="number"
                step="0.01"
                placeholder="75000"
                value={formData.grossIncome}
                onChange={(e) => setFormData(prev => ({ ...prev, grossIncome: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="additionalDeductions">Additional Deductions (NLe)</Label>
              <Input
                id="additionalDeductions"
                type="number"
                step="0.01"
                placeholder="5000"
                value={formData.additionalDeductions}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalDeductions: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Business expenses, itemized deductions, etc. (Standard deduction is included automatically)
              </p>
            </div>
            
            <Button onClick={calculateTax} disabled={loading} className="w-full">
              {loading ? 'Calculating...' : 'Calculate Tax'}
            </Button>
          </CardContent>
        </Card>

        {/* Tax Calculation Results */}
        {calculation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tax Calculation Results
              </CardTitle>
              <CardDescription>
                Based on {formData.taxYear} tax brackets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="font-medium">Gross Income:</span>
                  <span>NLe{calculation.grossIncome.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Total Deductions:</span>
                  <span>NLe{calculation.deductions.toLocaleString()}</span>
                </div>
                {typeof calculation.statutoryPension === 'number' && calculation.statutoryPension > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>NASSIT (5%) included:</span>
                    <span>NLe{calculation.statutoryPension.toLocaleString()}</span>
                  </div>
                )}
                {typeof calculation.standardDeduction === 'number' && calculation.standardDeduction > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Standard deduction:</span>
                    <span>NLe{calculation.standardDeduction.toLocaleString()}</span>
                  </div>
                )}
                {typeof calculation.additionalDeductions === 'number' && calculation.additionalDeductions > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Additional deductions:</span>
                    <span>NLe{calculation.additionalDeductions.toLocaleString()}</span>
                  </div>
                )}
                {calculation.deductionsCapped && (
                  <div className="text-xs text-amber-600">Deductions were capped to gross income.</div>
                )}
                
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Taxable Income:</span>
                  <span>NLe{calculation.taxableIncome.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                  <span>Estimated Tax Owed:</span>
                  <span>NLe{calculation.taxOwed.toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Effective Rate</div>
                    <div className="text-xl font-semibold">{calculation.effectiveRate.toFixed(1)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Marginal Rate</div>
                    <div className="text-xl font-semibold">{calculation.marginalRate}%</div>
                  </div>
                </div>
              </div>
              
              <Button onClick={saveTaxFiling} variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Save as Draft Filing
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tax Brackets Reference */}
      {taxRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{formData.taxYear} Tax Brackets</CardTitle>
            <CardDescription>Current tax brackets for reference</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {taxRules.map((rule, index) => (
                <div key={rule.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">
                      NLe{rule.income_bracket_min.toLocaleString()}
                      {rule.income_bracket_max ? ` - NLe${rule.income_bracket_max.toLocaleString()}` : '+'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{rule.tax_rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}