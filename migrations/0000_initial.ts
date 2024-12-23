import { pgTable, serial, text, timestamp, boolean, integer, jsonb, varchar } from "drizzle-orm/pg-core";

export async function up(db) {
  await db.schema
    .alterTable("users")
    .addColumn("legal_consent", jsonb("legal_consent"))
    .addColumn("consent_version", varchar("consent_version", { length: 10 }))
    .execute();
}

export async function down(db) {
  await db.schema
    .alterTable("users")
    .dropColumn("legal_consent")
    .dropColumn("consent_version")
    .execute();
} 