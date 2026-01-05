/*
  # Enable Real-time Updates for Leaderboard

  1. Changes
    - Enable real-time replication for profiles table
    - This allows the leaderboard to update live when any player's SuperCash balance changes
  
  2. Security
    - Real-time updates respect existing RLS policies
    - Players can only see public profile data as defined by existing policies
*/

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
