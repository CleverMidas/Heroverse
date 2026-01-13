/*
  # Allow Public Profile Viewing for Leaderboard

  1. Changes
    - Drop restrictive "Users can view own profile" policy
    - Add new policy allowing all authenticated users to view all profiles for leaderboard functionality
    - This enables the leaderboard to display all users' rankings and SuperCash balances
  
  2. Security
    - Users can still only UPDATE and INSERT their own profiles
    - All authenticated users can now view all profiles (username and supercash_balance)
    - This is necessary for leaderboard functionality
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policy allowing all authenticated users to view all profiles
CREATE POLICY "Anyone can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);