import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrlString = process.env.DATABASE_URL;
if (!dbUrlString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const url = new URL(dbUrlString);
let port = parseInt(url.port);

if (isNaN(port)) {
  console.warn("Warning: Port could not be parsed from DATABASE_URL. Defaulting to 5432 for PostgreSQL.");
  port = 5432; // Default PostgreSQL port
}

export default {
  schema: ['./db/schema.ts', './drizzle/schema/nexus.ts'],
  out: './db/migrations',
  dialect: 'postgresql',
  // For drizzle-kit push/migrate, ensuring all necessary fields are present and correctly typed.
  dbCredentials: {
    host: url.hostname,
    port: port, // Use the parsed or default port
    user: url.username,
    password: url.password,
    database: url.pathname.replace(/^\//, ''), // Remove leading slash for database name
    ssl: true // Neon typically requires SSL, explicitly set
  },
  // It's also common to put connection details for migrate/push outside dbCredentials if issues persist
  // migrations: {
  //   table: '__drizzle_migrations',
  //   schema: 'public'
  // },
  // driver: 'pg', // if using node-postgres directly for migrations
} satisfies Config;

