
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS streak_current integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_longest integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date text,
  ADD COLUMN IF NOT EXISTS beauty_hair_length text,
  ADD COLUMN IF NOT EXISTS beauty_makeup_level text,
  ADD COLUMN IF NOT EXISTS milestones_celebrated jsonb DEFAULT '[]'::jsonb;
