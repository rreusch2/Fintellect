import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'ep-icy-bread-a5zav1yt.us-east-2.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: process.env.DB_PASSWORD,
    database: 'neondb',
    ssl: true
  },
});

