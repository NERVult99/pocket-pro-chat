import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = "general" } = await req.json();

    // --- FINANCE-ONLY FILTER: Improved ---
    const userText = messages?.[messages.length - 1]?.content?.toLowerCase().trim() || "";
    const financeKeywords = [
      "budget", "expense", "income", "savings", "transaction", "financial", "investment",
      "spend", "cost", "revenue", "bill", "bank", "loan", "debt", "salary", "profit", "loss",
      "account", "credit", "debit", "tax", "interest", "emi", "mutual fund", "stock", "insurance",
      "wallet", "payment", "withdraw", "deposit", "transfer", "balance", "statement"
    ];
    const isFinance = financeKeywords.some((kw) => userText.includes(kw));
    if (!isFinance || userText.length < 5) {
      return new Response(
        JSON.stringify({ message: "Sorry, I can only answer finance-related questions. Please ask about budgets, expenses, savings, investments, or other financial topics." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // --- FILTER END ---

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user authentication
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch user's financial data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: recentTransactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(10);

    const { data: budgets } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Finance-focused system prompt
    const systemPrompt = `You are a personal finance assistant specialized in budgeting and expense management.

USER FINANCIAL PROFILE:
- Name: ${profile?.full_name || "User"}
- Monthly Income: ₹${profile?.monthly_income || "Not set"}
- Savings Goal: ₹${profile?.savings_goal || "Not set"}

RECENT TRANSACTIONS:
${recentTransactions?.map(t => `- ${t.category}: ₹${t.amount} at ${t.vendor || "unknown"}`).join("\n") || "No recent transactions"}

ACTIVE BUDGETS:
${budgets?.map(b => `- ${b.category}: ₹${b.spent_amount}/₹${b.allocated_amount} (${((b.spent_amount/b.allocated_amount)*100).toFixed(1)}% used)`).join("\n") || "No budgets set"}

YOUR CAPABILITIES:
1. **Expense Tracking**: Help categorize and monitor spending
2. **Budget Management**: Track budget usage and provide alerts
3. **Financial Analysis**: Analyze spending patterns and trends  
4. **Savings Optimization**: Recommend ways to reduce expenses
5. **Goal Tracking**: Monitor progress toward financial objectives

RESPONSE STYLE:
- Focus exclusively on financial advice and budget management
- Provide specific monetary amounts and percentages
- Alert when approaching or exceeding budget limits
- Suggest actionable financial improvements
- Use data-driven insights from user's actual financial data

Keep responses concise, relevant, and financially focused.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    };

    // Add budget analysis tools for structured financial responses
    if (type === "budget_analysis") {
      body.tools = [{
        type: "function",
        function: {
          name: "analyze_budget",
          description: "Analyze current budget status and spending patterns",
          parameters: {
            type: "object",
            properties: {
              category: { type: "string" },
              spent_amount: { type: "number" },
              budget_limit: { type: "number" },
              percentage_used: { type: "number" },
              status: { type: "string", enum: ["on_track", "warning", "exceeded"] },
              recommendation: { type: "string" }
            }
          }
        }
      }];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required. Please add credits." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save financial conversation to database
    await supabase.from("chat_messages").insert([
      {
        user_id: user.id,
        role: "user",
        content: messages[messages.length - 1].content
      },
      {
        user_id: user.id,
        role: "assistant",
        content: assistantMessage
      }
    ]);

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Finance chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Financial service error";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
