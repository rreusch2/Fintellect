import { pgTable, serial, text, timestamp, integer, boolean, jsonb, varchar, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../db/schema'; // Adjusted import path

export const nexus_conversations = pgTable('nexus_conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata')
});

export const nexus_messages = pgTable('nexus_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => nexus_conversations.id).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata')
});

export const nexus_agent_state = pgTable('nexus_agent_state', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => nexus_conversations.id).notNull(),
  state: jsonb('state').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const nexus_files = pgTable('nexus_files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  conversationId: integer('conversation_id').references(() => nexus_conversations.id),
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata')
}); 