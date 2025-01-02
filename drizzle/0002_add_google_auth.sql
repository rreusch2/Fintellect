-- Add email and Google auth fields
ALTER TABLE users 
ADD COLUMN email TEXT UNIQUE,
ADD COLUMN google_id TEXT UNIQUE,
ADD COLUMN google_email TEXT,
ADD COLUMN avatar TEXT;

-- Make password nullable since Google users won't have one
ALTER TABLE users ALTER COLUMN password DROP NOT NULL; 