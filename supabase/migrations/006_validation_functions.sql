CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  email_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO email_count FROM auth.users WHERE LOWER(email) = LOWER(email_to_check);
  RETURN email_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_username_exists(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  username_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO username_count FROM public.profiles WHERE LOWER(username) = LOWER(username_to_check);
  RETURN username_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO anon;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('heroes', 'heroes', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view hero images') THEN
    CREATE POLICY "Public can view hero images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'heroes');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload hero images') THEN
    CREATE POLICY "Authenticated users can upload hero images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'heroes');
  END IF;
END $$;
