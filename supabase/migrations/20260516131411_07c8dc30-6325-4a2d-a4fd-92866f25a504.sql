ALTER TABLE public.wardrobe
  ADD COLUMN IF NOT EXISTS pattern text,
  ADD COLUMN IF NOT EXISTS texture text,
  ADD COLUMN IF NOT EXISTS fit text,
  ADD COLUMN IF NOT EXISTS length text;