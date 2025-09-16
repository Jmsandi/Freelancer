import { Button } from '@/components/ui/button';
import { Calculator, FileText, TrendingUp, Shield, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">TaxEase</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <h1 className="text-5xl font-bold tracking-tight">
              Freelance Tax Filing Made
              <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent"> Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Streamline your tax process with automated calculations, expense tracking,
              and professional reporting. Built for freelancers and independent contractors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">Start Free Trial</Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Secure</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Fast setup</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Insightful analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tax management built for modern freelancers
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Smart Tax Calculator</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Progressive bracket math, live estimates, and optimized deductions.
            </p>
          </div>
          <div className="group rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Transaction Management</h3>
            </div>
            <p className="text-sm text-muted-foreground">CSV import, categorization, and receipt-friendly workflow.</p>
          </div>
          <div className="group rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Analytics Dashboard</h3>
            </div>
            <p className="text-sm text-muted-foreground">Clear charts, monthly breakdowns, and trends at a glance.</p>
          </div>
          <div className="group rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Secure & Compliant</h3>
            </div>
            <p className="text-sm text-muted-foreground">Bank-level security and compliant reporting.</p>
          </div>
          <div className="group rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">PDF Reports</h3>
            </div>
            <p className="text-sm text-muted-foreground">Professional, submission-ready tax reports.</p>
          </div>
          <div className="group rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Admin Controls</h3>
            </div>
            <p className="text-sm text-muted-foreground">Manage tax rules and configurations with ease.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <div className="container py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Taxes?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join freelancers who trust TaxEase for fast, accurate filings.
          </p>
          <Link to="/auth">
            <Button size="lg">Start Your Free Trial</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">TaxEase</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 TaxEase. Built for freelancers, by Ai PRO STUDENT.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
