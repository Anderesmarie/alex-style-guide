ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS snapshot_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('snapshots', 'snapshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Snapshots are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'snapshots');

CREATE POLICY "Users can upload own snapshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'snapshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own snapshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'snapshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own snapshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'snapshots' AND auth.uid()::text = (storage.foldername(name))[1]);