/*
  # Add Cyber Xoom Hero

  1. Changes
    - Inserts new "Cyber Xoom" hero into the heroes table
    - Set as Epic rarity (Tier 4)
    - Uses local image asset
    - Not a starter hero
    
  2. Details
    - Hero Name: Cyber Xoom
    - Tier: 4 (Epic - 200 SuperCash per hour)
    - Image: local:heroverse._hero_4
    - Description: A cutting-edge cyberpunk hero with advanced tech
*/

INSERT INTO heroes (name, rarity_id, image_url, is_starter) 
VALUES ('Cyber Xoom', 4, 'local:heroverse._hero_4', false)
ON CONFLICT DO NOTHING;
