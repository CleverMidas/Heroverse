-- Add referral columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_bonus_claimed boolean DEFAULT false;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'HERO' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Function to ensure all profiles have referral codes (for existing users)
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code on insert
DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON profiles;
CREATE TRIGGER ensure_referral_code_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_referral_code();

-- Update existing profiles with referral codes
UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- Function to apply a referral code (for new users)
CREATE OR REPLACE FUNCTION apply_referral_code(code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  current_user_record RECORD;
  referrer_record RECORD;
  referral_bonus bigint := 100;
  new_referrer_balance bigint;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT id, referred_by, referral_bonus_claimed, supercash_balance INTO current_user_record
  FROM profiles WHERE id = current_user_id;
  
  IF current_user_record.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;
  
  SELECT id, username, supercash_balance INTO referrer_record
  FROM profiles WHERE UPPER(referral_code) = UPPER(code);
  
  IF referrer_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  IF referrer_record.id = current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;
  
  -- Update current user's referred_by
  UPDATE profiles SET referred_by = referrer_record.id, updated_at = now()
  WHERE id = current_user_id;
  
  -- Give referrer the bonus
  new_referrer_balance := referrer_record.supercash_balance + referral_bonus;
  UPDATE profiles SET supercash_balance = new_referrer_balance, updated_at = now()
  WHERE id = referrer_record.id;
  
  -- Record transaction for referrer
  INSERT INTO transactions (user_id, type, amount, balance_after, description, related_user_id)
  VALUES (referrer_record.id, 'referral_bonus', referral_bonus, new_referrer_balance, 'Referral bonus - new user joined', current_user_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'referrer', referrer_record.username,
    'bonus_given', referral_bonus
  );
END;
$$;

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  invite_count integer;
  total_earned bigint;
  user_referral_code text;
  used_referral_code text;
  referrer_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT referral_code, referred_by INTO user_referral_code, referrer_id FROM profiles WHERE id = current_user_id;
  
  IF referrer_id IS NOT NULL THEN
    SELECT referral_code INTO used_referral_code FROM profiles WHERE id = referrer_id;
  END IF;
  
  SELECT COUNT(*) INTO invite_count FROM profiles WHERE referred_by = current_user_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO total_earned
  FROM transactions 
  WHERE user_id = current_user_id AND type = 'referral_bonus';
  
  RETURN jsonb_build_object(
    'success', true,
    'referral_code', user_referral_code,
    'invite_count', invite_count,
    'total_earned', total_earned,
    'used_referral_code', used_referral_code
  );
END;
$$;

-- Function to check if user has used a referral code
CREATE OR REPLACE FUNCTION has_used_referral()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND referred_by IS NOT NULL);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION apply_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION has_used_referral() TO authenticated;

