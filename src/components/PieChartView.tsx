import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const PieChartView = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("month", currentMonth);

      if (budgetData && budgetData.length > 0) {
        const total = budgetData.reduce((sum, budget) => sum + Number(budget.spent_amount), 0);
        
        const chartData = budgetData.map((budget, index) => ({
          name: budget.category.charAt(0).toUpperCase() + budget.category.slice(1),
          value: total > 0 ? Math.round((Number(budget.spent_amount) / total) * 100) : 0,
          amount: Number(budget.spent_amount),
          color: colors[index % colors.length]
        })).filter(item => item.amount > 0);

        setData(chartData);
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderLabel = (entry: any) => {
    return `${entry.value}%`;
  };

  if (loading) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Budget Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Budget Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">No spending data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle>Spending Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => [`${value}% (₹${props.payload.amount})`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PieChartView;
``