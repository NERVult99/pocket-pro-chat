import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CSVExport = () => {
  const [loading, setLoading] = useState(false);

  const handleDownloadCSV = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to download transactions");
        return;
      }

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("transaction_date", { ascending: false });

      if (!transactions || transactions.length === 0) {
        toast.error("No transactions found to export");
        return;
      }

      const csvData = [
        ['Date', 'Category', 'Amount', 'Vendor', 'Description'],
        ...transactions.map(transaction => [
          transaction.transaction_date 
            ? new Date(transaction.transaction_date).toLocaleDateString()
            : 'No Date',
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
      
      toast.success(`Downloaded ${transactions.length} transactions`);
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
        </p>
        <Button onClick={handleDownloadCSV} className="w-full" disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          {loading ? "Downloading..." : "Download CSV"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CSVExport;
