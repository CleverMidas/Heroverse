-- Add unique constraint on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON profiles (LOWER(username)) WHERE username IS NOT NULL;

-- Create function to check if email exists in auth.users
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO email_count
  FROM auth.users
  WHERE LOWER(email) = LOWER(email_to_check);
  
  RETURN email_count > 0;
END;
$$;

-- Create function to check if username exists in profiles
CREATE OR REPLACE FUNCTION check_username_exists(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO username_count
  FROM profiles
  WHERE LOWER(username) = LOWER(username_to_check);
  
  RETURN username_count > 0;
END;
$$;

-- Grant execute permission to all users (including anonymous for signup)
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_username_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_username_exists(TEXT) TO anon;

