-- Add investment profile column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS investment_profile JSONB DEFAULT NULL; 