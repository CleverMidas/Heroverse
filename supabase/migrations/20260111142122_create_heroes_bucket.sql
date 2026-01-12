/*
  # Create Heroes Storage Bucket

  1. Changes
    - Create public 'heroes' storage bucket for hero images
    - Enable public access for the bucket
    - Set up RLS policies for bucket access

  2. Security
    - Public bucket allows anyone to view images
    - Only authenticated users can upload
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'heroes',
  'heroes',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view hero images'
  ) THEN
    CREATE POLICY "Public can view hero images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'heroes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload hero images'
  ) THEN
    CREATE POLICY "Authenticated users can upload hero images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'heroes');
  END IF;
END $$;
