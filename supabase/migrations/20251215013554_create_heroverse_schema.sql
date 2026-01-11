CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  supercash_balance bigint DEFAULT 0 NOT NULL,
  has_claimed_free_hero boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS hero_rarities (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  tier int NOT NULL CHECK (tier >= 1 AND tier <= 10),
  supercash_per_hour int NOT NULL,
  color_hex text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE hero_rarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hero rarities"
  ON hero_rarities FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rarity_id int NOT NULL REFERENCES hero_rarities(id),
  image_url text,
  is_starter boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view heroes"
  ON heroes FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS user_heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hero_id uuid NOT NULL REFERENCES heroes(id),
  is_active boolean DEFAULT false NOT NULL,
  activated_at timestamptz,
  last_collected_at timestamptz,
  acquired_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_heroes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own heroes"
  ON user_heroes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own heroes"
  ON user_heroes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own heroes"
  ON user_heroes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO hero_rarities (name, tier, supercash_per_hour, color_hex, description) VALUES
  ('Common', 1, 25, '#9CA3AF', 'A humble beginning. Every legend starts somewhere.'),
  ('Uncommon', 2, 50, '#22C55E', 'Rising above the ordinary.'),
  ('Rare', 3, 100, '#3B82F6', 'A cut above the rest.'),
  ('Epic', 4, 200, '#A855F7', 'Tales are told of their deeds.'),
  ('Legendary', 5, 400, '#F59E0B', 'Their name echoes through history.'),
  ('Mythic', 6, 800, '#EF4444', 'Whispered in ancient prophecies.'),
  ('Divine', 7, 1600, '#EC4899', 'Blessed by the heavens themselves.'),
  ('Celestial', 8, 3200, '#06B6D4', 'Born among the stars.'),
  ('Cosmic', 9, 6400, '#8B5CF6', 'Masters of the universe.'),
  ('Supreme', 10, 12800, '#FBBF24', 'The pinnacle of power.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO heroes (name, rarity_id, image_url, is_starter) VALUES
  ('Guardian Nova', 1, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_3.jpg', true),
  ('Shadow Striker', 1, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_1.jpg', false),
  ('Storm Warden', 2, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_5.jpg', false),
  ('Frost Knight', 2, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_2.jpg', false),
  ('Blaze Phoenix', 3, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_6.jpg', false),
  ('Thunder Lord', 3, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_4.jpg', false),
  ('Void Walker', 4, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_7.jpg', false),
  ('Crimson Fury', 4, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_8.jpg', false),
  ('Golden Titan', 5, 'https://jwacklfxfscwcmlzmcqa.supabase.co/storage/v1/object/public/heroes/hero_9.jpg', false),

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  collected bigint;
BEGIN
  collected := public.calculate_pending_supercash(p_user_id);
  
  UPDATE public.profiles
  SET supercash_balance = supercash_balance + collected,
      updated_at = now()
  WHERE id = p_user_id;
  
  UPDATE public.user_heroes
  SET last_collected_at = now()
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN collected;
END;
$$;
