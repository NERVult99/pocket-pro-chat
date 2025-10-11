-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  monthly_income DECIMAL(10, 2),
  savings_goal DECIMAL(10, 2),
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  dietary_restrictions TEXT[],
  favorite_stores TEXT[],
  transport_mode TEXT DEFAULT 'car',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  category TEXT NOT NULL,
  allocated_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  savings_target DECIMAL(10, 2),
  actual_savings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, category)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  alternatives JSONB, -- Store alternative options that were available
  savings_opportunity DECIMAL(10, 2) DEFAULT 0, -- Amount could have saved
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- Store additional context like price comparisons, recommendations
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create price_comparisons table (for caching)
CREATE TABLE public.price_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  distance_km DECIMAL(10, 2),
  rating DECIMAL(3, 2),
  delivery_time_mins INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for budgets
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for price_comparisons (public read, restricted write)
CREATE POLICY "Anyone can view price comparisons"
  ON public.price_comparisons FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_budgets_user_month ON public.budgets(user_id, month);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_chat_messages_user_created ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX idx_price_comparisons_category ON public.price_comparisons(category, vendor);