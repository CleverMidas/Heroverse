ALTER TABLE public.user_heroes 
ADD COLUMN IF NOT EXISTS power_level int DEFAULT 100 NOT NULL CHECK (power_level >= 0 AND power_level <= 100),
ADD COLUMN IF NOT EXISTS last_power_update timestamptz DEFAULT now() NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_heroes_active_power ON public.user_heroes(user_id, is_active, power_level) WHERE is_active = true AND power_level > 0;

CREATE OR REPLACE FUNCTION public.decrease_hero_power()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  hero_record RECORD;
  hours_elapsed numeric;
  power_decrease int;
BEGIN
  FOR hero_record IN
    SELECT uh.id, uh.power_level, uh.last_power_update, uh.activated_at
    FROM public.user_heroes uh
    WHERE uh.is_active = true AND uh.power_level > 0
  LOOP
    hours_elapsed := EXTRACT(EPOCH FROM (now() - GREATEST(
      hero_record.last_power_update,
      COALESCE(hero_record.activated_at, now())
    ))) / 3600;
    
    power_decrease := FLOOR(hours_elapsed);
    
    IF power_decrease > 0 THEN
      UPDATE public.user_heroes
      SET 
        power_level = GREATEST(0, power_level - power_decrease),
        last_power_update = now()
      WHERE id = hero_record.id;
    END IF;
  END LOOP;
END;
$$;

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
  PERFORM public.decrease_hero_power();
  
  FOR hero_record IN
    SELECT uh.id, uh.last_collected_at, uh.activated_at, uh.power_level, hr.supercash_per_hour
    FROM public.user_heroes uh
    JOIN public.heroes h ON h.id = uh.hero_id
    JOIN public.hero_rarities hr ON hr.id = h.rarity_id
    WHERE uh.user_id = p_user_id 
      AND uh.is_active = true 
      AND uh.power_level > 0
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
SECURITY DEFINER SET search_path = ''
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
    
    UPDATE public.user_heroes 
    SET last_collected_at = NOW() 
    WHERE user_id = p_user_id 
      AND is_active = true 
      AND power_level > 0;
    
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'collect', pending_amount, new_balance, 'Collected from active heroes');
  END IF;
  RETURN COALESCE(pending_amount, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_hero_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
    NEW.last_power_update := now();
  ELSIF NEW.is_active = false THEN
    NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hero_activation_power_update
BEFORE UPDATE ON public.user_heroes
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION public.handle_hero_activation();
