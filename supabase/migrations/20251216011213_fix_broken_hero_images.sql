/*
  # Fix Broken Hero Image References

  1. Changes
    - Update Cyber Sentinel image reference from 'local:heroverse_hero_4' to 'local:hero_cyberpunk'
    - Update Cyber Xoom image reference from 'local:heroverse._hero_4' to 'local:hero_cyberpunk'
    - Update Star Forger image reference from 'local:heroverse._hero_4' to 'local:hero_cyberpunk'

  2. Details
    - All three heroes will use the same cyberpunk character image
    - This fixes the broken image references that were causing display issues
    - The hero_cyberpunk image is now properly mapped in heroImages.ts

  3. Notes
    - No RLS changes needed
    - This is a data fix migration
*/

-- Fix Cyber Sentinel image reference
UPDATE heroes
SET image_url = 'local:hero_cyberpunk'
WHERE name = 'Cyber Sentinel' AND image_url = 'local:heroverse_hero_4';

-- Fix Cyber Xoom image reference
UPDATE heroes
SET image_url = 'local:hero_cyberpunk'
WHERE name = 'Cyber Xoom' AND image_url = 'local:heroverse._hero_4';

-- Fix Star Forger image reference
UPDATE heroes
SET image_url = 'local:hero_cyberpunk'
WHERE name = 'Star Forger' AND image_url = 'local:heroverse._hero_4';
