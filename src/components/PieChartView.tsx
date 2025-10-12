import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const PieChartView = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthsToCompare, setMonthsToCompare] = useState<number>(2);
  const [multiMonthData, setMultiMonthData] = useState<any[]>([]);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
  const monthColors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

  const previousMonthData = [
    { name: 'Monthly Rent', value: 15, amount: 4996, color: '#0088FE' },
    { name: 'Food & Dining', value: 35, amount: 11500, color: '#00C49F' },
    { name: 'Essentials', value: 25, amount: 8200, color: '#FFBB28' },
    { name: 'Healthcare', value: 12, amount: 3950, color: '#FF8042' },
    { name: 'Lifestyle & Entertainment', value: 8, amount: 2650, color: '#8884D8' },
    { name: 'Savings & Investments', value: 5, amount: 1650, color: '#82CA9D' }
  ];

  const getComparisonData = () => {
    const categories = ['Monthly Rent', 'Food & Dining', 'Essentials', 'Healthcare', 'Lifestyle & Entertainment', 'Savings & Investments'];
    
    return categories.map(category => {
      const currentData = data.find(item => item.name === category) || { amount: 0 };
      const previousData = previousMonthData.find(item => item.name === category) || { amount: 0 };
      
      return {
        category: category.replace(' & ', '\n& '),
        current: currentData.amount,
        previous: previousData.amount
      };
    });
  };

  useEffect(() => {
    fetchBudgetData();
    fetchMultiMonthData();
  }, [monthsToCompare]);

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

  const fetchMultiMonthData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const months: string[] = [];
      const now = new Date();
      for (let i = 0; i < monthsToCompare; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(date.toISOString().slice(0, 7));
      }

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("transaction_date", `${months[months.length - 1]}-01`)
        .lte("transaction_date", `${months[0]}-31`);

      if (!transactions) return;

      const dailyData: any[] = [];
      for (let day = 1; day <= 31; day++) {
        const dayData: any = { day };
        
        months.forEach((month, idx) => {
          const monthName = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const dailyTotal = transactions
            .filter(t => {
              const tDate = new Date(t.transaction_date);
              return tDate.getMonth() === new Date(month + '-01').getMonth() &&
                     tDate.getFullYear() === new Date(month + '-01').getFullYear() &&
                     tDate.getDate() === day;
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          dayData[monthName] = dailyTotal;
        });
        
        dailyData.push(dayData);
      }

      setMultiMonthData(dailyData);
    } catch (error) {
      console.error("Error fetching multi-month data:", error);
    }
  };

  const getMonthLabels = () => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 0; i < monthsToCompare; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    return labels;
  };

  const renderLabel = (entry: any) => {
    return `${entry.value}%`;
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="w-full h-96">
            <CardHeader>
              <CardTitle>Current Month Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
          <Card className="w-full h-96">
            <CardHeader>
              <CardTitle>Previous Month Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="w-full h-96">
          <CardHeader>
            <CardTitle>Current Month Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">No spending data available</div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card className="w-full h-96">
          <CardHeader>
            <CardTitle>Previous Month (Sep 2025)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={previousMonthData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {previousMonthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value}% (₹${props.payload.amount})`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full h-96">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Multi-Month Expense Comparison</CardTitle>
          <Select value={monthsToCompare.toString()} onValueChange={(value) => setMonthsToCompare(Number(value))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Compare Last" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Months</SelectItem>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="4">4 Months</SelectItem>
              <SelectItem value="5">5 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={multiMonthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                fontSize={12}
                label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                fontSize={12}
                label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [`₹${value.toFixed(2)}`, '']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
              />
              {getMonthLabels().map((label, idx) => (
                <Line
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stroke={monthColors[idx % monthColors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={label}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PieChartView;
