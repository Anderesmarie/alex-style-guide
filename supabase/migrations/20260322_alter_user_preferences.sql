-- Add missing columns to user_preferences
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS reaction text;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS nb_fois_portee integer DEFAULT 0;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS derniere_utilisation timestamptz;

-- Drop NOT NULL on type (now using reaction instead)
ALTER TABLE public.user_preferences ALTER COLUMN type DROP NOT NULL;

-- Add UPDATE policy
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
