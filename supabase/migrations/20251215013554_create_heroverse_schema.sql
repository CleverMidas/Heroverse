/*
  # HeroVerse App Database Schema

  1. New Tables
    - `profiles` - User profiles with SuperCash balance
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, optional display name)
      - `supercash_balance` (bigint, default 0)
      - `has_claimed_free_hero` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `hero_rarities` - 10 tier rarity system
      - `id` (serial, primary key)
      - `name` (text, unique)
      - `tier` (int, 1-10)
      - `supercash_per_hour` (int)
      - `color_hex` (text, for UI display)
      - `description` (text)
    
    - `heroes` - Hero templates/avatars
      - `id` (uuid, primary key)
      - `name` (text)
      - `rarity_id` (int, references hero_rarities)
      - `image_url` (text)
      - `is_starter` (boolean, for free hero)
      - `created_at` (timestamptz)
    
    - `user_heroes` - Heroes owned by users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `hero_id` (uuid, references heroes)
      - `is_active` (boolean, default false)
      - `activated_at` (timestamptz, nullable)
      - `last_collected_at` (timestamptz, nullable)
      - `acquired_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to access their own data
    - Public read access for hero_rarities and heroes tables

  3. Functions
    - Trigger to create profile on user signup
    - Function to calculate uncollected SuperCash
*/

-- Create profiles table
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

-- Create hero_rarities table
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

-- Create heroes table
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

-- Create user_heroes table
CREATE TABLE IF NOT EXISTS user_heroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hero_id uuid NOT NULL REFERENCES heroes(id),
  is_active boolean DEFAULT false NOT NULL,
  activated_at timestamptz,
  last_collected_at timestamptz,
  acquired_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, hero_id)
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

-- Insert the 10 tier rarities
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

-- Insert starter heroes (one for each rarity, but only Common is starter)
INSERT INTO heroes (name, rarity_id, image_url, is_starter) VALUES
  ('Guardian Nova', 1, 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400', true),
  ('Shadow Striker', 1, 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Storm Warden', 2, 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Frost Knight', 2, 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Blaze Phoenix', 3, 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Thunder Lord', 3, 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Void Walker', 4, 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Crimson Fury', 4, 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Golden Titan', 5, 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Eclipse Sage', 5, 'https://images.pexels.com/photos/1462980/pexels-photo-1462980.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Dragon Emperor', 6, 'https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Arcane Master', 6, 'https://images.pexels.com/photos/2406949/pexels-photo-2406949.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Seraph Guardian', 7, 'https://images.pexels.com/photos/3760514/pexels-photo-3760514.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Astral Warden', 7, 'https://images.pexels.com/photos/3779760/pexels-photo-3779760.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Nebula King', 8, 'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Star Forger', 8, 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Universe Shaper', 9, 'https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Infinity Lord', 9, 'https://images.pexels.com/photos/2379003/pexels-photo-2379003.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('Omega Prime', 10, 'https://images.pexels.com/photos/3760610/pexels-photo-3760610.jpeg?auto=compress&cs=tinysrgb&w=400', false),
  ('The Absolute', 10, 'https://images.pexels.com/photos/3778966/pexels-photo-3778966.jpeg?auto=compress&cs=tinysrgb&w=400', false);

-- Function to handle new user signup
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

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate pending SuperCash for a user's active heroes
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

-- Function to collect SuperCash from active heroes
CREATE OR REPLACE FUNCTION public.collect_supercash(p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  collected bigint;
BEGIN
  -- Calculate pending amount
  collected := public.calculate_pending_supercash(p_user_id);
  
  -- Update user balance
  UPDATE public.profiles
  SET supercash_balance = supercash_balance + collected,
      updated_at = now()
  WHERE id = p_user_id;
  
  -- Update last_collected_at for all active heroes
  UPDATE public.user_heroes
  SET last_collected_at = now()
  WHERE user_id = p_user_id AND is_active = true;
  
  RETURN collected;
END;
$$;