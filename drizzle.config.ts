import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const url = new URL(process.env.DATABASE_URL!);

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: true
  },
} satisfies Config;

