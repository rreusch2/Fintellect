-- Remove is_default column from plaid_items if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plaid_items' 
        AND column_name = 'is_default'
    ) THEN
        ALTER TABLE plaid_items DROP COLUMN is_default;
    END IF;
END $$;

-- Ensure status column exists with default value
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plaid_items' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE plaid_items ADD COLUMN status text NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- Add UNIQUE constraint to plaid_transactions.plaid_transaction_id
DO $$ 
BEGIN
    -- First check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'plaid_transactions_plaid_transaction_id_key'
    ) THEN
        -- Add UNIQUE constraint if it doesn't exist
        ALTER TABLE plaid_transactions 
        ADD CONSTRAINT plaid_transactions_plaid_transaction_id_key 
        UNIQUE (plaid_transaction_id);
    END IF;
END $$;

-- If you need to recreate the table entirely, use this instead:
/*
CREATE TABLE plaid_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plaid_account_id INTEGER NOT NULL REFERENCES plaid_accounts(id),
  plaid_transaction_id TEXT NOT NULL UNIQUE,
  category TEXT,
  subcategory TEXT,
  type TEXT,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TIMESTAMP NOT NULL,
  pending BOOLEAN DEFAULT FALSE,
  merchant_name TEXT,
  payment_channel TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
*/ 