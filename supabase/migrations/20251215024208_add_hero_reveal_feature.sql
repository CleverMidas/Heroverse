ALTER TABLE user_heroes 
ADD COLUMN IF NOT EXISTS is_revealed boolean DEFAULT true NOT NULL;
