CREATE TABLE IF NOT EXISTS "alert_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"preference_id" integer NOT NULL,
	"conditions" jsonb,
	"delivery_methods" jsonb,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alert_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"config_id" integer NOT NULL,
	"result_id" integer NOT NULL,
	"alert_type" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"delivered_via" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_actioned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"topics" jsonb,
	"keywords" jsonb,
	"asset_classes" jsonb,
	"specific_assets" jsonb,
	"data_sources" jsonb,
	"analysis_types" jsonb,
	"custom_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"preference_id" integer NOT NULL,
	"schedule_id" integer,
	"result_type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" jsonb NOT NULL,
	"sources" jsonb,
	"analysis_metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_saved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"relevant_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"preference_id" integer NOT NULL,
	"schedule_type" varchar(20) NOT NULL,
	"cron_expression" text,
	"event_trigger" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_config" ADD CONSTRAINT "alert_config_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_config" ADD CONSTRAINT "alert_config_preference_id_research_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."research_preferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_config_id_alert_config_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."alert_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_result_id_research_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."research_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_preferences" ADD CONSTRAINT "research_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_results" ADD CONSTRAINT "research_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_results" ADD CONSTRAINT "research_results_preference_id_research_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."research_preferences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_results" ADD CONSTRAINT "research_results_schedule_id_research_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."research_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_schedules" ADD CONSTRAINT "research_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_schedules" ADD CONSTRAINT "research_schedules_preference_id_research_preferences_id_fk" FOREIGN KEY ("preference_id") REFERENCES "public"."research_preferences"("id") ON DELETE no action ON UPDATE no action;