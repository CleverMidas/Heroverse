/*
  # Grant Cyber Xoom to All Users as Mystery Hero

  1. Changes
    - Grants the new "Cyber Xoom" hero to all existing users
    - Hero is granted with `is_revealed = false` for the mystery reveal experience
    - Only grants to users who don't already have this hero
    
  2. Details
    - Hero: Cyber Xoom (Epic)
    - Initial State: Unrevealed mystery hero
    - Users can reveal the hero through the UI
*/

-- Grant Cyber Xoom to all existing users as an unrevealed hero
INSERT INTO user_heroes (user_id, hero_id, is_active, is_revealed)
SELECT 
  p.id,
  h.id,
  false,
  false
FROM profiles p
CROSS JOIN heroes h
WHERE h.name = 'Cyber Xoom'
AND NOT EXISTS (
  SELECT 1 FROM user_heroes uh 
  WHERE uh.user_id = p.id AND uh.hero_id = h.id
)
ON CONFLICT (user_id, hero_id) DO NOTHING;
