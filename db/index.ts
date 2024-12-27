import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from '@neondatabase/serverless';
import * as schema from "./schema";
import 'dotenv/config';
import ws from 'ws';

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your .env file and ensure it's being loaded correctly.");
}

// Create a connection pool with WebSocket configuration
const pool = new Pool({ 
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20,
  idleTimeoutMillis: 30000,
  maxUses: 7500,
  webSocketConstructor: ws,
});

// Create the database instance with schema
export const db = drizzle(pool, { schema });

// Function to test database connection
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await pool.end();
});
