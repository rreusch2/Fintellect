-- Migration: Add nexus_tool_calls table for storing tool execution history

CREATE TABLE "nexus_tool_calls" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL REFERENCES "nexus_conversations"("id"),
  "message_id" text NOT NULL,
  "tool_name" text NOT NULL,
  "tool_index" integer NOT NULL,
  "args" jsonb,
  "result" jsonb,
  "status" varchar(20) NOT NULL,
  "is_success" boolean DEFAULT true,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX "idx_nexus_tool_calls_conversation_id" ON "nexus_tool_calls" ("conversation_id");
CREATE INDEX "idx_nexus_tool_calls_message_id" ON "nexus_tool_calls" ("message_id");
CREATE INDEX "idx_nexus_tool_calls_timestamp" ON "nexus_tool_calls" ("timestamp");