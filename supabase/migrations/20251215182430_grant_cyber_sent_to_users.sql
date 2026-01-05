/*
  # Grant Cyber Sent to All Users as Mystery Hero

  1. Changes
    - Grants the "Cyber Sent" hero to all existing users
    - Hero is granted with `is_revealed = false` for the mystery reveal experience
    - Only grants to users who don't already have this hero
    
  2. Details
    - Hero: Cyber Sent (Epic)
    - Initial State: Unrevealed mystery hero
    - Users can reveal the hero through the UI
*/

-- Grant Cyber Sent to all existing users as an unrevealed hero
INSERT INTO user_heroes (user_id, hero_id, is_active, is_revealed)
SELECT 
  p.id,
  h.id,
  false,
  false
FROM profiles p
CROSS JOIN heroes h
WHERE h.name = 'Cyber Sent'
AND NOT EXISTS (
  SELECT 1 FROM user_heroes uh 
  WHERE uh.user_id = p.id AND uh.hero_id = h.id
)
ON CONFLICT (user_id, hero_id) DO NOTHING;
