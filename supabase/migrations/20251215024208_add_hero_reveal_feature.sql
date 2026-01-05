/*
  # Add Hero Reveal Feature

  1. Changes
    - Add `is_revealed` column to `user_heroes` table
    - Default is true for backward compatibility with existing heroes
    - Heroes with is_revealed = false will show a mystery cover until revealed

  2. Notes
    - Existing user heroes will have is_revealed = true
    - New mystery heroes can be granted with is_revealed = false
*/

ALTER TABLE user_heroes 
ADD COLUMN IF NOT EXISTS is_revealed boolean DEFAULT true NOT NULL;