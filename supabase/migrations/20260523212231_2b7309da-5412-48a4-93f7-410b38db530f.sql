-- Add share_snapshot_url column to outfits
ALTER TABLE public.outfits
ADD COLUMN IF NOT EXISTS share_snapshot_url text;

-- Create public bucket for shareable outfit snapshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('outfit-shares', 'outfit-shares', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read for outfit-shares
DROP POLICY IF EXISTS "Outfit shares are publicly readable" ON storage.objects;
CREATE POLICY "Outfit shares are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'outfit-shares');

-- Authenticated users can upload to their own folder ({userId}/...)
DROP POLICY IF EXISTS "Users can upload own outfit shares" ON storage.objects;
CREATE POLICY "Users can upload own outfit shares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'outfit-shares'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own outfit shares" ON storage.objects;
CREATE POLICY "Users can update own outfit shares"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'outfit-shares'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own outfit shares" ON storage.objects;
CREATE POLICY "Users can delete own outfit shares"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'outfit-shares'
  AND auth.uid()::text = (storage.foldername(name))[1]
);