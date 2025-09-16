import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calculator, FileText, TrendingUp, Plus, LogOut, User, Settings, Receipt, DollarSign } from 'lucide-react';
// removed duplicate useState import
import TransactionsPage from '@/components/TransactionsPage';
import TaxCalculatorPage from '@/components/TaxCalculatorPage';
import TaxFilingsPage from '@/components/TaxFilingsPage';
import ProfilePage from '@/components/ProfilePage';
import SettingsPage from '@/components/SettingsPage';

type Transaction = {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  transaction_date: string;
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const sidebarItems = [
  { title: 'Dashboard', icon: TrendingUp, id: 'dashboard' },
  { title: 'Transactions', icon: Receipt, id: 'transactions' },
  { title: 'Tax Calculator', icon: Calculator, id: 'calculator' },
  { title: 'Tax Filings', icon: FileText, id: 'filings' },
  { title: 'Profile', icon: User, id: 'profile' },
  { title: 'Settings', icon: Settings, id: 'settings' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('amount,type,category,transaction_date')
        .order('transaction_date', { ascending: true });
      setTransactions((data as Transaction[]) || []);
    };
    load();
  }, []);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expenses: number }>();
    MONTH_LABELS.forEach((m) => map.set(m, { month: m, income: 0, expenses: 0 }));
    transactions.forEach((t) => {
      const d = new Date(t.transaction_date);
      const label = MONTH_LABELS[d.getMonth()];
      const entry = map.get(label)!;
      if (t.type === 'income') entry.income += t.amount;
      else entry.expenses += t.amount;
    });
    return Array.from(map.values());
  }, [transactions]);

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const netProfit = totalIncome - totalExpenses;

  const expenseCategoryData = useMemo(
    () =>
      Object.entries(
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc: Record<string, number>, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {})
      ).map(([name, value]) => ({ name, value, color: 'hsl(var(--primary))' })),
    [transactions]
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">NLe{totalIncome.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last year
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">NLe{totalExpenses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last year
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">NLe{netProfit.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last year
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tax Estimate</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">NLe{(netProfit * 0.22).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    22% effective rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                  <CardDescription>Monthly breakdown for 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="income" fill="hsl(var(--primary))" name="Income" />
                      <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription>Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks to get you started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('transactions')}
                  >
                    <Plus className="h-6 w-6" />
                    <span>Add Transaction</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('calculator')}
                  >
                    <Calculator className="h-6 w-6" />
                    <span>Calculate Tax</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('filings')}
                  >
                    <FileText className="h-6 w-6" />
                    <span>File Taxes</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Receipt className="h-6 w-6" />
                    <span>Upload Receipt</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'transactions':
        return <TransactionsPage />;
      case 'calculator':
        return <TaxCalculatorPage />;
      case 'filings':
        return <TaxFilingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground">This feature is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Tax Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">Welcome back, {user.user_metadata?.full_name || user.email}</h1>
                <p className="text-muted-foreground">Manage your freelance tax filings</p>
              </div>
            </div>
          </div>
          
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}