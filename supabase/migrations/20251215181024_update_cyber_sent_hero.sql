/*
  # Update Cyber Sentinel to Cyber Sent (Tier 4)

  1. Changes
    - Updates existing "Cyber Sentinel" hero to "Cyber Sent"
    - Changes rarity from Tier 3 (Rare) to Tier 4 (Epic)
    - Updates image reference to use correct filename
    
  2. Details
    - Hero Name: Cyber Sent
    - Tier: 4 (Epic - 200 SuperCash per hour)
    - Image: local:heroverse_hero_4
    - Description: A cyberpunk warrior with advanced tech augmentations
*/

UPDATE heroes
SET 
  name = 'Cyber Sent',
  rarity_id = 4,
  image_url = 'local:heroverse_hero_4'
WHERE name = 'Cyber Sentinel';
