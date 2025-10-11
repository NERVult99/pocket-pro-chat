-- Add budget recommendation fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN budget_recommendation_message TEXT,
ADD COLUMN budget_recommendation_type TEXT CHECK (budget_recommendation_type IN ('success', 'warning', 'error'));
