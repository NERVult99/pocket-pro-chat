import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  MessageCircle,
  LogOut,
  Settings,
  Receipt,
  PieChart,
  AlertCircle
} from "lucide-react";

interface Budget {
  id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  transaction_date: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Refresh data when component becomes visible (user returns from budget setup)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUser();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await loadDashboardData(session.user.id);
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      setProfile(profileData);

      // Load current month's budgets
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("month", currentMonth);

      if (budgetData) {
        setBudgets(budgetData);
        const spent = budgetData.reduce((sum, b) => sum + Number(b.spent_amount), 0);
        const allocated = budgetData.reduce((sum, b) => sum + Number(b.allocated_amount), 0);
        setTotalSpent(spent);
        setTotalBudget(allocated);
      }

      // Load recent transactions
      const { data: transactionData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: false })
        .limit(5);

      if (transactionData) {
        setRecentTransactions(transactionData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getBudgetStatus = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100;
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "warning";
    return "success";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "destructive":
        return "bg-destructive";
      case "warning":
        return "bg-accent";
      default:
        return "bg-secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const savingsProgress = profile?.savings_goal > 0 
    ? ((profile?.monthly_income - totalSpent) / profile?.savings_goal) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Budget Buddy</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="shadow-card hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Monthly Budget</CardDescription>
              <CardTitle className="text-3xl">₹{totalBudget.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Spent: ₹{totalSpent.toLocaleString()}</span>
                  <span className={`font-semibold ${overallProgress > 90 ? 'text-destructive' : 'text-secondary'}`}>
                    {overallProgress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover-lift">
            <CardHeader className="pb-3">
              <CardDescription>Savings Goal</CardDescription>
              <CardTitle className="text-3xl">₹{(profile?.savings_goal || 0).toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold text-secondary">{Math.min(savingsProgress, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(savingsProgress, 100)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover-lift bg-gradient-success text-white">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/80">Potential Savings</CardDescription>
              <CardTitle className="text-3xl">
                ₹{Math.max(0, totalBudget - totalSpent).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Remaining this month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Categories */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Budget Categories</CardTitle>
                <CardDescription>Track your spending across categories</CardDescription>
              </div>
              <Button onClick={() => navigate("/budget-setup")}>
                <PieChart className="w-4 h-4 mr-2" />
                Manage Budgets
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* AI Recommendation Alert */}
            {profile?.budget_recommendation_message && profile?.budget_recommendation_type && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                profile.budget_recommendation_type === 'success' ? 'bg-green-50 border border-green-200 dark:bg-green-950/30' :
                profile.budget_recommendation_type === 'warning' ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30' :
                'bg-red-50 border border-red-200 dark:bg-red-950/30'
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  profile.budget_recommendation_type === 'success' ? 'text-green-600' :
                  profile.budget_recommendation_type === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`} />
                <p className={`text-sm font-medium ${
                  profile.budget_recommendation_type === 'success' ? 'text-green-800 dark:text-green-300' :
                  profile.budget_recommendation_type === 'warning' ? 'text-yellow-800 dark:text-yellow-300' :
                  'text-red-800 dark:text-red-300'
                }`}>
                  {profile.budget_recommendation_message}
                </p>
              </div>
            )}
            
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No budgets set up yet</p>
                <Button onClick={() => navigate("/budget-setup")}>Create Your First Budget</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const percentage = (Number(budget.spent_amount) / Number(budget.allocated_amount)) * 100;
                  const status = getBudgetStatus(Number(budget.spent_amount), Number(budget.allocated_amount));
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{budget.category}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{Number(budget.spent_amount).toLocaleString()} / ₹{Number(budget.allocated_amount).toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${
                          status === 'destructive' ? 'text-destructive' : 
                          status === 'warning' ? 'text-accent' : 
                          'text-secondary'
                        }`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={percentage} className={`h-2 ${getStatusColor(status)}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest spending activity</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate("/transactions")}>
                <Receipt className="w-4 h-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{transaction.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.vendor} • {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-destructive">-₹{Number(transaction.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="shadow-card hover-lift cursor-pointer" onClick={() => navigate("/chat")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Ask Budget Buddy</h3>
                  <p className="text-sm text-muted-foreground">Get AI-powered financial advice</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover-lift cursor-pointer" onClick={() => navigate("/transactions")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Expenses</h3>
                  <p className="text-sm text-muted-foreground">Log new transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
