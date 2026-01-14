CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  supercash_balance bigint DEFAULT 0 NOT NULL,
  has_claimed_free_hero boolean DEFAULT false NOT NULL,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  referral_bonus_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON profiles (LOWER(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

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
CREATE POLICY "Anyone can view hero rarities" ON hero_rarities FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rarity_id int NOT NULL REFERENCES hero_rarities(id),
  image_url text,
  is_starter boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view heroes" ON heroes FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_heroes_rarity_id ON heroes(rarity_id);

CREATE TABLE IF NOT EXISTS user_heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hero_id uuid NOT NULL REFERENCES heroes(id),
  is_active boolean DEFAULT false NOT NULL,
  is_revealed boolean DEFAULT true NOT NULL,
  activated_at timestamptz,
  last_collected_at timestamptz,
  acquired_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_heroes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own heroes" ON user_heroes FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own heroes" ON user_heroes FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own heroes" ON user_heroes FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_user_heroes_hero_id ON user_heroes(hero_id);

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
  ('Guardian Nova', 1, 'hero_3.jpg', true),
  ('Shadow Striker', 1, 'hero_1.jpg', false),
  ('Storm Warden', 2, 'hero_5.jpg', false),
  ('Frost Knight', 2, 'hero_2.jpg', false),
  ('Blaze Phoenix', 3, 'hero_6.jpg', false),
  ('Thunder Lord', 3, 'hero_4.jpg', false),
  ('Void Walker', 4, 'hero_7.jpg', false),
  ('Crimson Fury', 4, 'hero_8.jpg', false),
  ('Golden Titan', 5, 'hero_9.jpg', false);

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

