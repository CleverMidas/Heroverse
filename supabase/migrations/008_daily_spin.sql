ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_spin_at timestamptz;

ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('send', 'receive', 'collect', 'mystery_box', 'referral_bonus', 'daily_bonus', 'quest_reward', 'admin_bonus', 'daily_spin'));

CREATE OR REPLACE FUNCTION public.perform_daily_spin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  user_record RECORD;
  last_spin_time timestamptz;
  hours_since_spin numeric;
  selected_prize jsonb;
  prize_type text;
  prize_value bigint;
  new_balance bigint;
  hero_id_to_give uuid;
  available_heroes uuid[];
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); 
  END IF;

  SELECT id, last_spin_at, supercash_balance INTO user_record 
  FROM public.profiles 
  WHERE id = current_user_id;

  IF user_record.last_spin_at IS NOT NULL THEN
    hours_since_spin := EXTRACT(EPOCH FROM (now() - user_record.last_spin_at)) / 3600;
    IF hours_since_spin < 24 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'You must wait 24 hours between spins',
        'hours_remaining', 24 - hours_since_spin
      );
    END IF;
  END IF;

  WITH prize_pool AS (
    SELECT * FROM (VALUES
      (1, 'sc', 10::bigint),
      (2, 'sc', 10::bigint),
      (3, 'sc', 10::bigint),
      (4, 'sc', 10::bigint),
      (5, 'sc', 10::bigint),
      (6, 'sc', 10::bigint),
      (7, 'sc', 10::bigint),
      (8, 'sc', 10::bigint),
      (9, 'sc', 15::bigint),
      (10, 'sc', 15::bigint),
      (11, 'sc', 15::bigint),
      (12, 'sc', 15::bigint),
      (13, 'sc', 15::bigint),
      (14, 'sc', 15::bigint),
      (15, 'sc', 25::bigint),
      (16, 'sc', 25::bigint),
      (17, 'sc', 25::bigint),
      (18, 'sc', 25::bigint),
      (19, 'sc', 25::bigint),
      (20, 'sc', 50::bigint),
      (21, 'sc', 50::bigint),
      (22, 'sc', 50::bigint),
      (23, 'sc', 50::bigint),
      (24, 'sc', 100::bigint),
      (25, 'sc', 100::bigint),
      (26, 'sc', 100::bigint),
      (27, 'sc', 150::bigint),
      (28, 'sc', 150::bigint),
      (29, 'sc', 500::bigint),
      (30, 'hero', 0::bigint)
    ) AS t(id, type, value)
  )
  SELECT jsonb_build_object('type', type, 'value', value) INTO selected_prize
  FROM prize_pool
  ORDER BY random()
  LIMIT 1;

  prize_type := selected_prize->>'type';
  prize_value := (selected_prize->>'value')::bigint;

  UPDATE public.profiles 
  SET last_spin_at = now(), updated_at = now()
  WHERE id = current_user_id;

  IF prize_type = 'sc' THEN
    UPDATE public.profiles 
    SET supercash_balance = supercash_balance + prize_value, updated_at = now()
    WHERE id = current_user_id
    RETURNING supercash_balance INTO new_balance;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, metadata)
    VALUES (
      current_user_id, 
      'daily_spin', 
      prize_value, 
      new_balance, 
      'Daily Spin Reward',
      jsonb_build_object('prize_type', 'sc', 'prize_value', prize_value)
    );

    RETURN jsonb_build_object(
      'success', true,
      'prize_type', 'sc',
      'prize_value', prize_value,
      'new_balance', new_balance
    );

  ELSIF prize_type = 'hero' THEN
    SELECT ARRAY_AGG(id) INTO available_heroes
    FROM public.heroes
    WHERE is_starter = false;

    IF available_heroes IS NULL OR array_length(available_heroes, 1) = 0 THEN
      UPDATE public.profiles 
      SET supercash_balance = supercash_balance + 100, updated_at = now()
      WHERE id = current_user_id
      RETURNING supercash_balance INTO new_balance;

      INSERT INTO public.transactions (user_id, type, amount, balance_after, description, metadata)
      VALUES (
        current_user_id, 
        'daily_spin', 
        100, 
        new_balance, 
        'Daily Spin Reward (Hero fallback)',
        jsonb_build_object('prize_type', 'sc', 'prize_value', 100, 'original_prize', 'hero')
      );

      RETURN jsonb_build_object(
        'success', true,
        'prize_type', 'sc',
        'prize_value', 100,
        'new_balance', new_balance,
        'note', 'Hero prize converted to 100 SC (no heroes available)'
      );
    END IF;

    hero_id_to_give := available_heroes[1 + floor(random() * array_length(available_heroes, 1))::int];

    INSERT INTO public.user_heroes (user_id, hero_id, is_active, is_revealed, power_level)
    VALUES (current_user_id, hero_id_to_give, false, true, 100);

    SELECT supercash_balance INTO new_balance FROM public.profiles WHERE id = current_user_id;
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, metadata)
    VALUES (
      current_user_id, 
      'daily_spin', 
      0, 
      new_balance, 
      'Daily Spin Reward - Free Hero',
      jsonb_build_object('prize_type', 'hero', 'hero_id', hero_id_to_give)
    );

    RETURN jsonb_build_object(
      'success', true,
      'prize_type', 'hero',
      'hero_id', hero_id_to_give,
      'new_balance', new_balance
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid prize type');
END;
$$;

GRANT EXECUTE ON FUNCTION public.perform_daily_spin() TO authenticated;
