import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CSVExport = () => {
  const [loading, setLoading] = useState(false);

  const getSampleData = async () => {
    try {
      // Fetch the CSV data from the public folder
      const response = await fetch('/sampleTransactions.csv');
      const csvText = await response.text();
      
      // Parse CSV data
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',');
      
      const transactions = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          transaction_date: values[0].split('T')[0], // Extract only date part
          category: values[1],
          amount: Math.abs(parseFloat(values[2])), // Remove negative sign
          vendor: values[3],
          description: values[4]
        };
      });
      
      return transactions;
    } catch (error) {
      console.error('Error loading sample data:', error);
      // Fallback to a few sample records if CSV loading fails
      return [
        { transaction_date: '2025-09-01', category: 'Monthly Rent', amount: -4996, vendor: 'Landlord', description: 'Monthly house rent payment' },
        { transaction_date: '2025-09-01', category: 'Food & Dining', amount: -250, vendor: 'Zomato', description: 'Lunch delivery order' }
      ];
    }
  };

  const handleDownloadCSV = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to download transactions");
        return;
      }

      // Load user transactions
      const { data: userTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("transaction_date", { ascending: false });

      // Get sample data from CSV file (6 months: April-September 2025)
      const sampleData = await getSampleData();

      // Combine user transactions with sample data
      const allTransactions = [...(userTransactions || []), ...sampleData];

      if (allTransactions.length === 0) {
        toast.error("No transactions found to export");
        return;
      }

      const csvData = [
        ['Date', 'Category', 'Amount', 'Vendor', 'Description'],
        ...allTransactions.map(transaction => [
          transaction.transaction_date || 'No Date',
          transaction.category || 'No Category',
          transaction.amount || 0,
          transaction.vendor || 'No Vendor',
          transaction.description || 'No Description'
        ])
      ];

      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${allTransactions.length} transactions (including ${sampleData.length} sample records from April-September 2025)`);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error("Failed to download transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Export Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download all your transaction data as a CSV file with date, category, amount, vendor, and description. 
          Includes 6 months of sample records (April-September 2025) for demonstration.
        </p>
        <Button onClick={handleDownloadCSV} className="w-full" disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          {loading ? "Downloading..." : "Download CSV with Sample Data"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CSVExport;
