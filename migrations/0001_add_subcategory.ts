import { sql } from "drizzle-orm";

export async function up(db) {
  await sql`ALTER TABLE plaid_transactions ADD COLUMN IF NOT EXISTS subcategory text;`.execute(db);
}

export async function down(db) {
  await sql`ALTER TABLE plaid_transactions DROP COLUMN IF EXISTS subcategory;`.execute(db);
} 