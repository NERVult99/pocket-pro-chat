import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface BudgetCategory {
  category: string;
  allocated_amount: number;
}

const BudgetSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [budgets, setBudgets] = useState<BudgetCategory[]>([
    { category: "groceries", allocated_amount: 0 },
    { category: "dining", allocated_amount: 0 },
    { category: "transportation", allocated_amount: 0 },
    { category: "entertainment", allocated_amount: 0 },
  ]);

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
    await loadExistingBudgets(session.user.id);
  };

  const loadExistingBudgets = async (uid: string) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data } = await supabase
        .from("budgets")
        .select("category, allocated_amount")
        .eq("user_id", uid)
        .eq("month", currentMonth);

      if (data && data.length > 0) {
        setBudgets(data.map(b => ({
          category: b.category,
          allocated_amount: Number(b.allocated_amount)
        })));
      }
    } catch (error) {
      console.error("Error loading budgets:", error);
    }
  };

  const handleAmountChange = (index: number, value: string) => {
    const newBudgets = [...budgets];
    newBudgets[index].allocated_amount = parseFloat(value) || 0;
    setBudgets(newBudgets);
  };

  const handleCategoryChange = (index: number, value: string) => {
    const newBudgets = [...budgets];
    newBudgets[index].category = value.toLowerCase().replace(/\s+/g, "_");
    setBudgets(newBudgets);
  };

  const addCategory = () => {
    setBudgets([...budgets, { category: "", allocated_amount: 0 }]);
  };

  const removeCategory = (index: number) => {
    setBudgets(budgets.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Delete existing budgets for this month
      await supabase
        .from("budgets")
        .delete()
        .eq("user_id", userId)
        .eq("month", currentMonth);

      // Insert new budgets
      const budgetData = budgets
        .filter(b => b.category && b.allocated_amount > 0)
        .map(b => ({
          user_id: userId,
          month: currentMonth,
          category: b.category,
          allocated_amount: b.allocated_amount,
          spent_amount: 0,
        }));

      if (budgetData.length > 0) {
        const { error } = await supabase.from("budgets").insert(budgetData);

        if (error) throw error;

        toast.success("Budgets saved successfully!");
        navigate("/dashboard");
      } else {
        toast.error("Please add at least one budget category");
      }
    } catch (error) {
      console.error("Error saving budgets:", error);
      toast.error("Failed to save budgets");
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Budget Setup</h1>
            <p className="text-sm text-muted-foreground">Manage your monthly budget</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle>Total Monthly Budget</CardTitle>
            <CardDescription>Set your spending limits for each category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              ₹{totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {budgets.map((budget, index) => (
            <Card key={index} className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Input
                      id={`category-${index}`}
                      value={budget.category}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      placeholder="e.g., Groceries, Dining"
                      className="capitalize"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`amount-${index}`}>Monthly Budget (₹)</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      value={budget.allocated_amount || ""}
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCategory(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={addCategory}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Budgets
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BudgetSetup;