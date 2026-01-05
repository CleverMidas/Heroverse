/*
  # Add Cyber Sentinel Hero

  1. Changes
    - Adds a new hero "Cyber Sentinel" to the heroes table
    - Rarity: Rare (tier 3)
    - Image: local:heroverse_hero_4
    - SuperCash per hour: 100 (Rare tier rate)
    
  2. Details
    - Hero Name: Cyber Sentinel
    - Description: A cyberpunk warrior with advanced tech augmentations
    - Not a starter hero
*/

INSERT INTO heroes (name, rarity_id, image_url, is_starter) VALUES
  ('Cyber Sentinel', 3, 'local:heroverse_hero_4', false)
ON CONFLICT DO NOTHING;