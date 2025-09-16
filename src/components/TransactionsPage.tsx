import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';

type TransactionCategory = 
  | 'freelance_income'
  | 'consulting_income' 
  | 'product_sales'
  | 'other_income'
  | 'office_supplies'
  | 'software_subscriptions'
  | 'marketing'
  | 'travel'
  | 'meals_entertainment'
  | 'professional_development'
  | 'equipment'
  | 'other_expense';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: TransactionCategory;
  type: TransactionType;
  transaction_date: string;
  is_tax_deductible: boolean;
  receipt_url?: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '' as TransactionCategory | '',
    type: 'expense' as TransactionType,
    transaction_date: new Date().toISOString().split('T')[0],
    is_tax_deductible: false
  });

  const categories: { value: TransactionCategory; label: string }[] = [
    { value: 'freelance_income', label: 'Freelance Income' },
    { value: 'consulting_income', label: 'Consulting Income' },
    { value: 'product_sales', label: 'Product Sales' },
    { value: 'other_income', label: 'Other Income' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'software_subscriptions', label: 'Software Subscriptions' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'travel', label: 'Travel' },
    { value: 'meals_entertainment', label: 'Meals & Entertainment' },
    { value: 'professional_development', label: 'Professional Development' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other_expense', label: 'Other Expense' }
  ];

  const handleCsvImport = async (file: File) => {
    return new Promise<void>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as any[];
            const mapped = rows
              .map((row) => {
                const rawAmount = String(row.amount ?? row.Amount ?? '').replace(/,/g, '');
                const parsedAmount = parseFloat(rawAmount);
                const type = (row.type ?? row.Type ?? '').toLowerCase();
                const category = (row.category ?? row.Category ?? '').toLowerCase();
                const date = row.transaction_date ?? row.date ?? row.Date ?? '';
                const description = row.description ?? row.Description ?? '';
                const deductibleRaw = (row.is_tax_deductible ?? row.tax_deductible ?? row.Deductible ?? '').toString().toLowerCase();
                const is_tax_deductible = deductibleRaw === 'true' || deductibleRaw === 'yes' || deductibleRaw === '1';

                if (!parsedAmount || !description || !date || (type !== 'income' && type !== 'expense')) {
                  return null;
                }

                return {
                  amount: parsedAmount,
                  description,
                  category: (category || 'other_expense') as TransactionCategory,
                  type: type as TransactionType,
                  transaction_date: new Date(date).toISOString().split('T')[0],
                  is_tax_deductible,
                  user_id: user?.id,
                };
              })
              .filter(Boolean);

            if (mapped.length === 0) {
              toast({ title: 'CSV Import', description: 'No valid rows found', variant: 'destructive' });
              resolve();
              return;
            }

            const { error } = await supabase.from('transactions').insert(mapped);
            if (error) throw error;
            toast({ title: 'CSV Import', description: `Imported ${mapped.length} transactions` });
            fetchTransactions();
          } catch (err) {
            toast({ title: 'CSV Import failed', description: 'Please check your CSV format', variant: 'destructive' });
          } finally {
            resolve();
          }
        },
        error: () => {
          toast({ title: 'CSV Parse error', description: 'Could not parse the file', variant: 'destructive' });
          resolve();
        },
      });
    });
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }

    const transactionData = {
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      type: formData.type,
      transaction_date: formData.transaction_date,
      is_tax_deductible: formData.is_tax_deductible,
      user_id: user?.id
    };

    try {
      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Transaction updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([transactionData]);
        
        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Transaction added successfully"
        });
      }

      fetchTransactions();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
      
      fetchTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: '',
      type: 'expense',
      transaction_date: new Date().toISOString().split('T')[0],
      is_tax_deductible: false
    });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      transaction_date: transaction.transaction_date,
      is_tax_deductible: transaction.is_tax_deductible
    });
    setIsDialogOpen(true);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const taxDeductibleExpenses = transactions
    .filter(t => t.type === 'expense' && t.is_tax_deductible)
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return <div className="flex justify-center p-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">NLe{totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">NLe{totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">NLe{taxDeductibleExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Manage your income and expense transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleCsvImport(file);
                    e.currentTarget.value = '';
                  }}
                />
                <Button asChild variant="outline">
                  <span>
                    <Upload className="mr-2 h-4 w-4" /> Import CSV
                  </span>
                </Button>
              </label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTransaction ? 'Update transaction details' : 'Add a new income or expense transaction'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: TransactionType) => 
                          setFormData(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Transaction description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: TransactionCategory) => 
                        setFormData(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tax_deductible"
                      checked={formData.is_tax_deductible}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_tax_deductible: !!checked }))
                      }
                    />
                    <Label htmlFor="tax_deductible">Tax deductible</Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingTransaction ? 'Update' : 'Add'} Transaction
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Add your first transaction to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax Deductible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categories.find(c => c.value === transaction.category)?.label || transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      NLe{transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {transaction.is_tax_deductible && (
                        <Badge className="bg-blue-100 text-blue-800">Deductible</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}