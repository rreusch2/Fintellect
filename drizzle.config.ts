import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

// --- Start Debugging Lines ---
console.log('Attempting to load DB_PASSWORD...');
const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword || typeof dbPassword !== 'string' || dbPassword.trim() === '') {
  console.error('Error: DB_PASSWORD environment variable is missing, empty, or not a string.');
  console.error('Please ensure DB_PASSWORD is set correctly in your .env file.');
  process.exit(1); // Stop the script if password is invalid
}
console.log('DB_PASSWORD loaded successfully (type:', typeof dbPassword, ')');
// --- End Debugging Lines ---

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'ep-icy-bread-a5zav1yt.us-east-2.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: dbPassword,
    database: 'neondb',
    ssl: true
  },
});

