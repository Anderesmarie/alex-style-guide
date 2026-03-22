ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_colors JSONB DEFAULT '[]'::jsonb;
