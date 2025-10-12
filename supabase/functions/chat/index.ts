import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message } = await req.json();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(10);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: currentBudgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth);

    const systemPrompt = `You are a proactive financial advisor helping users save money and make smart spending decisions.

USER CONTEXT:
- Name: ${profile?.full_name || 'User'}
- Monthly Income: ₹${profile?.monthly_income || 'Not set'}
- Savings Goal: ₹${profile?.savings_goal || 'Not set'}
- Dietary Restrictions: ${profile?.dietary_restrictions?.join(', ') || 'None'}

RECENT SPENDING:
${recentTransactions?.map(t => `- ${t.category}: ₹${t.amount} at ${t.vendor || 'unknown'}`).join('\n') || 'No recent transactions'}

CURRENT MONTH BUDGETS:
${currentBudgets?.map(b => `- ${b.category}: ₹${b.spent_amount} / ₹${b.allocated_amount}`).join('\n') || 'No budgets set'}

PRICE COMPARISON DATA (Mock):
Groceries:
- BigBasket: ₹850/week (delivery: ₹40, time: 2hrs)
- Amazon Fresh: ₹920/week (delivery: free, time: 1hr)
- Local Store: ₹780/week (delivery: none, time: 15min walk)

Dining:
- Zomato: ₹350/meal (delivery: ₹30, time: 30min)
- Swiggy: ₹380/meal (delivery: ₹25, time: 25min)
- Cooking at home: ₹120/meal (time: 45min)

Transportation:
- Uber: ₹15/km
- Ola: ₹13/km
- Public transport: ₹5/km

Provide personalized advice based on their budget, spending patterns, and preferences. Be conversational, helpful, and focus on actionable savings opportunities.`;

    const geminiPrompt = `${systemPrompt}\n\nUser question: ${message}`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: geminiPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Gemini API request failed');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.';

    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: assistantMessage },
    ]);

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
