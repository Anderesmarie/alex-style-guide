CREATE TABLE public.daily_outfits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.daily_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily outfits"
  ON public.daily_outfits
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);