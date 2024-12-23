import { defineConfig } from "drizzle-kit";
import { Pool } from '@neondatabase/serverless';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { runMigration } from './migrations/remap_housing';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateAll() {
  try {
    // First run the housing category remapping
    await runMigration();

    // Then run any other migrations
    await pool.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS legal_consent JSONB,
          ADD COLUMN IF NOT EXISTS consent_version VARCHAR(10);

          ALTER TABLE plaid_transactions
          ADD COLUMN IF NOT EXISTS subcategory TEXT;
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;
      END $$;
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