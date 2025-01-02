import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function clearDatabase() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS 
        plaid_transactions,
        plaid_accounts,
        plaid_items,
        goals,
        budgets,
        feature_requests,
        users
      CASCADE;
    `);
    
    console.log('Successfully cleared database');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearDatabase(); 