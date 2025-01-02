import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function initSchema() {
  try {
    console.log('Starting schema initialization...');
    const result = await pool.query(/* sql */`
      -- Users table
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        has_plaid_setup BOOLEAN NOT NULL DEFAULT FALSE,
        has_completed_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
        monthly_income INTEGER NOT NULL DEFAULT 0,
        onboarding_step INTEGER NOT NULL DEFAULT 1,
        last_login_at TIMESTAMP,
        remember_token TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        legal_consent JSONB,
        consent_version VARCHAR(10),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Plaid items table
      CREATE TABLE plaid_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plaid_access_token TEXT NOT NULL,
        plaid_item_id TEXT NOT NULL,
        plaid_institution_id TEXT NOT NULL,
        plaid_institution_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        last_sync TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        error JSONB,
        consent_expires_at TIMESTAMP
      );

      -- Plaid accounts table
      CREATE TABLE plaid_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plaid_item_id INTEGER NOT NULL REFERENCES plaid_items(id),
        plaid_account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        mask TEXT,
        type TEXT NOT NULL,
        subtype TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        current_balance INTEGER,
        available_balance INTEGER,
        iso_currency_code TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Plaid transactions table
      CREATE TABLE plaid_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plaid_account_id INTEGER NOT NULL REFERENCES plaid_accounts(id),
        plaid_transaction_id TEXT NOT NULL,
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

      -- Goals table
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'savings',
        target_amount INTEGER NOT NULL,
        current_amount INTEGER NOT NULL DEFAULT 0,
        deadline TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'in_progress',
        category TEXT NOT NULL DEFAULT 'general',
        description TEXT,
        ai_suggestions JSONB DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Budgets table
      CREATE TABLE budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        period TEXT NOT NULL DEFAULT 'monthly',
        start_date TIMESTAMP NOT NULL,
        category TEXT NOT NULL,
        amount_limit INTEGER NOT NULL,
        alert_threshold INTEGER DEFAULT 80,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Feature requests table
      CREATE TABLE feature_requests (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        use_case TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Schema initialized successfully:', result);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initSchema(); 