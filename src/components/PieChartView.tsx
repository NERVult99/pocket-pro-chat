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
  const [pieChartMonths, setPieChartMonths] = useState<number>(2);
  const [multiMonthPieData, setMultiMonthPieData] = useState<any[]>([]);
  const [budgetLineData, setBudgetLineData] = useState<any[]>([]);

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

  useEffect(() => {
    fetchMultiMonthPieData();
    fetchBudgetLineData();
  }, [pieChartMonths]);

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

  const fetchMultiMonthPieData = async () => {
    try {
      // Fetch CSV data
      const response = await fetch('/sampleTransactions.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      const transactions = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          date: values[0],
          category: values[1],
          amount: Math.abs(parseFloat(values[2])),
          vendor: values[3],
          description: values[4]
        };
      });

      // Get months based on selection (most recent months)
      const allMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const selectedMonths = allMonths.slice(-pieChartMonths); // Get last N months

      // Filter transactions for selected months
      const filteredTransactions = transactions.filter(t => {
        const [day, month, year] = t.date.split('/');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[parseInt(month) - 1];
        return selectedMonths.includes(monthName) && year === '2025';
      });

      // Group by category
      const categories = ['Monthly Rent', 'Food & Dining', 'Essentials', 'Healthcare', 'Lifestyle & Entertainment', 'Savings & Investments'];
      const pieData = categories.map((category, index) => {
        const totalAmount = filteredTransactions
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          name: category,
          value: totalAmount,
          color: colors[index % colors.length]
        };
      }).filter(item => item.value > 0);

      const total = pieData.reduce((sum, item) => sum + item.value, 0);
      const pieDataWithPercentage = pieData.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
      }));

      setMultiMonthPieData(pieDataWithPercentage);
    } catch (error) {
      console.error("Error fetching multi-month pie data:", error);
    }
  };

  const fetchBudgetLineData = async () => {
    try {
      // Fetch CSV data
      const response = await fetch('/sampleTransactions.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      const transactions = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          date: values[0],
          category: values[1],
          amount: Math.abs(parseFloat(values[2])),
          vendor: values[3],
          description: values[4]
        };
      });

      // Get last 6 months
      const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      
      const lineData = months.map(monthName => {
        const monthTransactions = transactions.filter(t => {
          const [day, month, year] = t.date.split('/');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames[parseInt(month) - 1] === monthName && year === '2025';
        });

        const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const budget = totalSpent * 1.2; // Assume budget is 20% more than spent
        
        return {
          month: monthName,
          budget: budget,
          spent: totalSpent,
          remaining: budget - totalSpent
        };
      });

      setBudgetLineData(lineData);
    } catch (error) {
      console.error("Error fetching budget line data:", error);
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
    if (entry.value < 5) return ''; // Hide labels for small slices
    return `${entry.value}%`;
  };

  if (loading) {
    return (
      <div className="h-full space-y-6 p-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Current Month Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-80">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Previous Month Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-80">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6 p-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Current Month Spending</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">No spending data available</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={renderLabel}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [`${value}% (₹${props.payload.amount})`, name]} 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={60}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Previous Month (Sep 2025)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={previousMonthData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {previousMonthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${value}% (₹${props.payload.amount})`, name]} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Multi-Month Pie Chart Comparison</CardTitle>
          <Select value={pieChartMonths.toString()} onValueChange={(value) => setPieChartMonths(Number(value))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Months" />
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
          {multiMonthPieData.length === 0 ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center text-muted-foreground">Loading pie chart data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={multiMonthPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.percentage > 5 ? `${entry.percentage}%` : ''}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {multiMonthPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${value}% (₹${props.payload.value})`, name]} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>6 Months Budget vs Spending</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetLineData.length === 0 ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center text-muted-foreground">Loading budget data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={budgetLineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", r: 4 }}
                  name="Budget"
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: "#EF4444", r: 4 }}
                  name="Spent"
                />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", r: 4 }}
                  name="Remaining"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PieChartView;
