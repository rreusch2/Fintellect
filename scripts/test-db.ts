import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL);
  
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT 1`;
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection(); 