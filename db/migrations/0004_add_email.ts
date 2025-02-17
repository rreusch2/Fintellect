import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar } from "drizzle-orm/pg-core";

export async function up(db) {
  // First add the column as nullable
  await db.schema
    .alterTable("users")
    .addColumn("email", text("email"))
    .execute();

  // Add unique constraint
  await db.schema
    .createIndex("users_email_unique")
    .on("users")
    .column("email")
    .unique()
    .execute();

  // Make it required for new users
  await db.schema
    .alterTable("users")
    .alterColumn("email", col => col.setNotNull())
    .execute();
}

export async function down(db) {
  await db.schema
    .alterTable("users")
    .dropColumn("email")
    .execute();
} 