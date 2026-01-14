CREATE OR REPLACE FUNCTION public.apply_referral_code(code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  current_user_record RECORD;
  referrer_record RECORD;
  referral_bonus bigint := 100;
  new_referrer_balance bigint;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  SELECT id, referred_by, referral_bonus_claimed, supercash_balance INTO current_user_record FROM public.profiles WHERE id = current_user_id;
  IF current_user_record.referred_by IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'You have already used a referral code'); END IF;
  SELECT id, username, supercash_balance INTO referrer_record FROM public.profiles WHERE UPPER(referral_code) = UPPER(code);
  IF referrer_record.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code'); END IF;
  IF referrer_record.id = current_user_id THEN RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code'); END IF;
  UPDATE public.profiles SET referred_by = referrer_record.id, updated_at = now() WHERE id = current_user_id;
  new_referrer_balance := referrer_record.supercash_balance + referral_bonus;
  UPDATE public.profiles SET supercash_balance = new_referrer_balance, updated_at = now() WHERE id = referrer_record.id;
  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, related_user_id)
  VALUES (referrer_record.id, 'referral_bonus', referral_bonus, new_referrer_balance, 'Referral bonus - new user joined', current_user_id);
  RETURN jsonb_build_object('success', true, 'referrer', referrer_record.username, 'bonus_given', referral_bonus);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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
  IF current_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  SELECT referral_code, referred_by INTO user_referral_code, referrer_id FROM public.profiles WHERE id = current_user_id;
  IF referrer_id IS NOT NULL THEN SELECT referral_code INTO used_referral_code FROM public.profiles WHERE id = referrer_id; END IF;
  SELECT COUNT(*) INTO invite_count FROM public.profiles WHERE referred_by = current_user_id;
  SELECT COALESCE(SUM(amount), 0) INTO total_earned FROM public.transactions WHERE user_id = current_user_id AND type = 'referral_bonus';
  RETURN jsonb_build_object('success', true, 'referral_code', user_referral_code, 'invite_count', invite_count, 'total_earned', total_earned, 'used_referral_code', used_referral_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_used_referral()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND referred_by IS NOT NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_used_referral() TO authenticated;
