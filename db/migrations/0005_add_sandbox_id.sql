-- Add sandbox_id column to conversations table for persistent Daytona sandbox storage
ALTER TABLE "conversations" ADD COLUMN "sandbox_id" text;
--> statement-breakpoint

-- Also add it to nexus_conversations if it exists  
ALTER TABLE "nexus_conversations" ADD COLUMN "sandbox_id" text;
--> statement-breakpoint 