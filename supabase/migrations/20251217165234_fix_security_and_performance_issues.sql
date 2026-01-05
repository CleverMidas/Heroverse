/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Foreign Key Indexes
  Foreign key columns without indexes can cause significant performance degradation during:
    - JOIN operations
    - CASCADE deletes
    - Foreign key constraint validation
    
  **Changes:**
    - Add index on `heroes.rarity_id` (references hero_rarities)
    - Add index on `user_heroes.hero_id` (references heroes)
  
  ## 2. Optimize RLS Policies for Performance
  RLS policies that call `auth.uid()` directly re-evaluate the function for each row,
  causing unnecessary overhead. Using `(select auth.uid())` evaluates once per query.
  
  **Changes:**
    - Update all 6 RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - Tables affected: `profiles`, `user_heroes`
  
  ## 3. Configuration Issues (Manual Action Required)
  The following issues cannot be fixed via SQL migration and require dashboard configuration:
  
  **Auth DB Connection Strategy:**
    - Navigate to: Settings > Database > Connection pooling
    - Change from fixed (10 connections) to percentage-based allocation
  
  **Leaked Password Protection:**
    - Navigate to: Authentication > Policies
    - Enable "Leaked Password Protection" to check against HaveIBeenPwned.org
*/

-- ========================================
-- 1. Add Missing Foreign Key Indexes
-- ========================================

-- Index for heroes.rarity_id foreign key
CREATE INDEX IF NOT EXISTS idx_heroes_rarity_id 
ON heroes(rarity_id);

-- Index for user_heroes.hero_id foreign key
CREATE INDEX IF NOT EXISTS idx_user_heroes_hero_id 
ON user_heroes(hero_id);

-- ========================================
-- 2. Optimize RLS Policies
-- ========================================

-- Drop and recreate profiles policies with optimized auth.uid() calls

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Drop and recreate user_heroes policies with optimized auth.uid() calls

DROP POLICY IF EXISTS "Users can view own heroes" ON user_heroes;
CREATE POLICY "Users can view own heroes"
  ON user_heroes FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own heroes" ON user_heroes;
CREATE POLICY "Users can insert own heroes"
  ON user_heroes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own heroes" ON user_heroes;
CREATE POLICY "Users can update own heroes"
  ON user_heroes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
