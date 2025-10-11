import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Receipt, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  vendor: string;
  description: string;
  transaction_date: string;
}

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");
  
  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");

  const categories = ["groceries", "dining", "transportation", "entertainment", "utilities", "shopping", "other"];

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);
    await loadTransactions(session.user.id);
  };

  const loadTransactions = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", uid)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!amount || !category || !vendor) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        amount: parseFloat(amount),
        category,
        vendor,
        description,
        transaction_date: new Date().toISOString(),
      });

      if (error) throw error;

      // Update budget spent amount
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budget } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .eq("category", category)
        .single();

      if (budget) {
        await supabase
          .from("budgets")
          .update({
            spent_amount: Number(budget.spent_amount) + parseFloat(amount),
          })
          .eq("id", budget.id);
      }

      toast.success("Transaction added successfully!");
      setDialogOpen(false);
      setAmount("");
      setCategory("");
      setVendor("");
      setDescription("");
      await loadTransactions(userId);
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Transactions</h1>
              <p className="text-sm text-muted-foreground">{transactions.length} total</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="w-5 h-5" />
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>Record a new expense</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Input
                      id="vendor"
                      placeholder="Store or restaurant name"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional notes"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleAddTransaction} className="w-full">
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No transactions yet</h2>
            <p className="text-muted-foreground mb-6">Start tracking your expenses</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Transaction
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txns]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground sticky top-20 bg-background py-2">
                  {date}
                </h3>
                <div className="space-y-2">
                  {txns.map((transaction) => (
                    <Card key={transaction.id} className="p-4 hover:shadow-card transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.vendor}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {transaction.category}
                              {transaction.description && ` • ${transaction.description}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-destructive">
                          -₹{Number(transaction.amount).toLocaleString()}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Transactions;