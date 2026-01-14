CREATE OR REPLACE FUNCTION public.calculate_pending_supercash(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  total_pending bigint := 0;
  hero_record RECORD;
  hours_elapsed numeric;
  earned bigint;
BEGIN
  FOR hero_record IN
    SELECT uh.id, uh.last_collected_at, uh.activated_at, hr.supercash_per_hour
    FROM public.user_heroes uh
    JOIN public.heroes h ON h.id = uh.hero_id
    JOIN public.hero_rarities hr ON hr.id = h.rarity_id
    WHERE uh.user_id = p_user_id AND uh.is_active = true
  LOOP
    hours_elapsed := EXTRACT(EPOCH FROM (now() - COALESCE(hero_record.last_collected_at, hero_record.activated_at))) / 3600;
    earned := FLOOR(hours_elapsed * hero_record.supercash_per_hour);
    total_pending := total_pending + earned;
  END LOOP;
  RETURN total_pending;
END;
$$;

CREATE OR REPLACE FUNCTION public.collect_supercash(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_amount bigint;
  new_balance bigint;
BEGIN
  SELECT public.calculate_pending_supercash(p_user_id) INTO pending_amount;
  IF pending_amount > 0 THEN
    UPDATE public.profiles 
    SET supercash_balance = supercash_balance + pending_amount, updated_at = NOW()
    WHERE id = p_user_id
    RETURNING supercash_balance INTO new_balance;
    UPDATE public.user_heroes SET last_collected_at = NOW() WHERE user_id = p_user_id AND is_active = true;
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'collect', pending_amount, new_balance, 'Collected from active heroes');
  END IF;
  RETURN COALESCE(pending_amount, 0);
END;
$$;

