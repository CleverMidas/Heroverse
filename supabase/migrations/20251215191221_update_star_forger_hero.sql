/*
  # Update Star Forger Hero with New Image and Grant to All Users

  1. Changes
    - Update Star Forger hero to use new cyberpunk character image
    - Grant Star Forger to all existing users
    - Set as revealed and ready to use
  
  2. Security
    - No RLS changes needed
*/

-- Update Star Forger with new image
UPDATE heroes
SET image_url = 'local:heroverse._hero_4'
WHERE name = 'Star Forger';

-- Grant Star Forger to all users who don't already have it
INSERT INTO user_heroes (user_id, hero_id, is_revealed, acquired_at)
SELECT 
  p.id as user_id,
  h.id as hero_id,
  true as is_revealed,
  now() as acquired_at
FROM profiles p
CROSS JOIN heroes h
WHERE h.name = 'Star Forger'
AND NOT EXISTS (
  SELECT 1 FROM user_heroes uh
  WHERE uh.user_id = p.id AND uh.hero_id = h.id
);