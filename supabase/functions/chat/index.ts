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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get user profile and recent context
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

    // Build context-aware system prompt
    const systemPrompt = `You are a proactive financial advisor and budgeting assistant. 

USER CONTEXT:
- Name: ${profile?.full_name || "User"}
- Monthly Income: ₹${profile?.monthly_income || "Not set"}
- Savings Goal: ₹${profile?.savings_goal || "Not set"}
- Transport: ${profile?.transport_mode || "Not set"}
- Dietary Restrictions: ${profile?.dietary_restrictions?.join(", ") || "None"}

RECENT SPENDING:
${recentTransactions?.map(t => `- ${t.category}: ₹${t.amount} at ${t.vendor || "unknown"}`).join("\n") || "No recent transactions"}

CURRENT BUDGETS:
${budgets?.map(b => `- ${b.category}: ₹${b.spent_amount}/₹${b.allocated_amount}`).join("\n") || "No budgets set"}

YOUR CAPABILITIES:
1. **Price Comparison**: Compare prices across vendors (groceries, restaurants, products)
2. **Opportunity Cost Analysis**: Show what savings could mean (e.g., "This coffee = 2 meals")
3. **Budget Tracking**: Monitor spending and alert on overspending
4. **Smart Recommendations**: Suggest cheaper alternatives and best deals
5. **Predictive Insights**: Warn about potential budget issues

MOCK PRICE DATA (use for comparisons):
Groceries:
- BigBasket: Milk ₹60, Bread ₹40, Rice (5kg) ₹350, Eggs ₹80
- Amazon Fresh: Milk ₹65, Bread ₹38, Rice (5kg) ₹340, Eggs ₹75
- Local Store: Milk ₹55, Bread ₹35, Rice (5kg) ₹380, Eggs ₹70

Restaurants:
- Swiggy: Biryani ₹250, Pizza ₹400, Burger ₹180, Delivery ₹40
- Zomato: Biryani ₹230, Pizza ₹420, Burger ₹170, Delivery ₹35
- Direct Order: Biryani ₹220, Pizza ₹380, Burger ₹160, No delivery

Transportation:
- Uber: 5km = ₹120, 10km = ₹200
- Ola: 5km = ₹110, 10km = ₹180
- Metro: 5km = ₹20, 10km = ₹30

RESPONSE STYLE:
- Be friendly, proactive, and financially savvy
- Use emojis appropriately (💰 💵 📊 📈 🎯)
- Provide concrete numbers and comparisons
- Show opportunity costs visually
- Suggest actionable alternatives
- Format responses with clear sections

When comparing prices:
1. Show all options with prices
2. Highlight the cheapest
3. Calculate potential savings
4. Show what that saving means (opportunity cost)
5. Factor in distance/convenience

Be conversational but data-driven!`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    };

    // Add tool calling for structured responses if needed
    if (type === "price_comparison") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "compare_prices",
            description: "Compare prices across vendors for a product or service",
            parameters: {
              type: "object",
              properties: {
                item: { type: "string" },
                vendors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                      distance: { type: "string" },
                      rating: { type: "number" }
                    }
                  }
                },
                cheapest: { type: "string" },
                savings: { type: "number" },
                opportunity_cost: { type: "string" }
              }
            }
          }
        }
      ];
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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save messages to database
    await supabase.from("chat_messages").insert([
      { user_id: user.id, role: "user", content: messages[messages.length - 1].content },
      { user_id: user.id, role: "assistant", content: assistantMessage }
    ]);

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});