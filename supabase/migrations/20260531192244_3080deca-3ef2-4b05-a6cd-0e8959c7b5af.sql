CREATE TABLE public.daily_outfits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  outfit_index integer NOT NULL,
  outfit_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  swipe_result text,
  layout_data jsonb,
  saved_outfit_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, outfit_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_outfits TO authenticated;
GRANT ALL ON public.daily_outfits TO service_role;

ALTER TABLE public.daily_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily outfits" ON public.daily_outfits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own daily outfits" ON public.daily_outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own daily outfits" ON public.daily_outfits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own daily outfits" ON public.daily_outfits
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_daily_outfits_user_date ON public.daily_outfits (user_id, date);