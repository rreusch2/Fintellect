import { defineConfig } from "drizzle-kit";
import { Pool } from '@neondatabase/serverless';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateAll() {
  try {
    // Drop existing tables if they exist
    await pool.query(`
      DROP TABLE IF EXISTS 
        insights,
        plaid_transactions,
        plaid_accounts,
        plaid_items_constraints,
        plaid_items,
        budgets,
        goals,
        users CASCADE;
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        has_plaid_setup BOOLEAN DEFAULT FALSE NOT NULL,
        has_completed_onboarding BOOLEAN DEFAULT FALSE NOT NULL,
        monthly_income INTEGER DEFAULT 0 NOT NULL,
        onboarding_step INTEGER DEFAULT 1 NOT NULL,
        last_login_at TIMESTAMP,
        remember_token TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        legal_consent JSONB,
        consent_version VARCHAR(10),
        investment_profile JSONB
      );
    `);

    // Create plaid_items table
    await pool.query(`
      CREATE TABLE plaid_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        plaid_item_id TEXT UNIQUE NOT NULL,
        plaid_access_token TEXT NOT NULL,
        plaid_institution_id TEXT NOT NULL,
        plaid_institution_name TEXT NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        last_sync TIMESTAMP,
        is_default BOOLEAN DEFAULT FALSE NOT NULL,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create plaid_items_constraints table
    await pool.query(`
      CREATE TABLE plaid_items_constraints (
        user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE,
        default_item_id INTEGER REFERENCES plaid_items(id)
      );
    `);

    // Create plaid_accounts table
    await pool.query(`
      CREATE TABLE plaid_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        plaid_item_id INTEGER REFERENCES plaid_items(id) NOT NULL,
        plaid_account_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        mask TEXT,
        type TEXT NOT NULL,
        subtype TEXT,
        current_balance INTEGER NOT NULL,
        available_balance INTEGER,
        iso_currency_code TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create plaid_transactions table
    await pool.query(`
      CREATE TABLE plaid_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        account_id INTEGER REFERENCES plaid_accounts(id) NOT NULL,
        plaid_transaction_id TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        merchant_name TEXT,
        description TEXT NOT NULL,
        pending BOOLEAN DEFAULT FALSE NOT NULL,
        date TIMESTAMP NOT NULL,
        authorized_date TIMESTAMP,
        payment_channel TEXT,
        iso_currency_code TEXT,
        location JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create insights table
    await pool.query(`
      CREATE TABLE insights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create budgets table
    await pool.query(`
      CREATE TABLE budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        name TEXT NOT NULL,
        period TEXT DEFAULT 'monthly' NOT NULL,
        start_date TIMESTAMP NOT NULL,
        category TEXT NOT NULL,
        spending_limit INTEGER NOT NULL,
        spent INTEGER DEFAULT 0 NOT NULL,
        alert_threshold INTEGER DEFAULT 80 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Create goals table
    await pool.query(`
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        target_amount INTEGER NOT NULL,
        current_amount INTEGER DEFAULT 0 NOT NULL,
        deadline TIMESTAMP,
        status TEXT DEFAULT 'in_progress' NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        ai_suggestions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateAll(); 