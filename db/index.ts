import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from '@neondatabase/serverless';
import * as schema from "./schema";
import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Configure Neon with WebSocket
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = "password";

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
    throw error; // Propagate the error for better debugging
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await pool.end();
});

// Add this function after the imports
async function connectWithRetry(maxRetries = 5, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await testDatabaseConnection();
      console.log('Successfully connected to database');
      return true;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed to connect after ${maxRetries} attempts`);
}

// Export the retry function
export { connectWithRetry };
