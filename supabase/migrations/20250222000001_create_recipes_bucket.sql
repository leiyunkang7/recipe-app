-- Storage Bucket for Recipe Images
-- Run this in Supabase SQL Editor

-- Create bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipes', 'recipes', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access
CREATE POLICY "Public read access to recipes bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipes');

-- Create policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to recipes bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipes'
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own uploads from recipes bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipes'
  AND auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
