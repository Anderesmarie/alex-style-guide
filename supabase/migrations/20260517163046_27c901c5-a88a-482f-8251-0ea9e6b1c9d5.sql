-- Bucket public pour les images du dressing
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-images', 'wardrobe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "Public read wardrobe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'wardrobe-images');

-- Upload : utilisateur authentifié, uniquement dans son propre dossier {user_id}/...
CREATE POLICY "Users can upload own wardrobe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wardrobe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own wardrobe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wardrobe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own wardrobe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wardrobe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Colonne URL sur wardrobe
ALTER TABLE public.wardrobe
ADD COLUMN IF NOT EXISTS image_url text;