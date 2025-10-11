-- Add recommendation field to budgets table
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS recommendation TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_budgets_recommendation ON public.budgets(user_id, month) WHERE recommendation IS NOT NULL;
