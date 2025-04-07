import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

// Research Topics and Preferences
export const researchPreferences = pgTable("research_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Categories and Items of Interest
  topics: jsonb("topics").$type<string[]>(), // e.g., ["technology", "finance", "healthcare"]
  keywords: jsonb("keywords").$type<string[]>(), // e.g., ["AI", "blockchain", "FDA approval"]
  
  // Asset Classes of Interest
  assetClasses: jsonb("asset_classes").$type<string[]>(), // e.g., ["equities", "crypto", "forex"]
  specificAssets: jsonb("specific_assets").$type<{
    tickers?: string[],
    cryptos?: string[],
    commodities?: string[],
    forex?: string[]
  }>(),
  
  // Data Source Preferences
  dataSources: jsonb("data_sources").$type<{
    newsApis?: boolean,
    marketData?: boolean,
    secFilings?: boolean,
    blogs?: boolean,
    socialMedia?: boolean,
    economicIndicators?: boolean
  }>(),
  
  // Analysis Preferences
  analysisTypes: jsonb("analysis_types").$type<{
    sentiment?: boolean,
    volumeSpikes?: boolean,
    priceAnomalies?: boolean,
    trendAnalysis?: boolean,
    keywordCooccurrence?: boolean,
    summarization?: boolean
  }>(),
  
  // Optional custom instructions from the user
  customInstructions: text("custom_instructions"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Research Schedules
export const researchSchedules = pgTable("research_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferenceId: integer("preference_id").references(() => researchPreferences.id).notNull(),
  
  // Schedule Type
  scheduleType: varchar("schedule_type", { length: 20 }).notNull(), // "hourly", "daily", "weekly", "custom", "event_based"
  
  // Details based on type
  cronExpression: text("cron_expression"), // For custom schedules (e.g., "0 9 * * 1-5" for weekdays at 9am)
  eventTrigger: text("event_trigger"), // For event-based schedules (e.g., "market_open", "market_close")
  timezone: text("timezone").default("UTC").notNull(),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Alert Configuration
export const alertConfig = pgTable("alert_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferenceId: integer("preference_id").references(() => researchPreferences.id).notNull(),
  
  // Alert Conditions
  conditions: jsonb("conditions").$type<{
    sentimentThreshold?: number,
    volumeThreshold?: number,
    priceChangeThreshold?: number,
    keywordOccurrence?: string[],
    specificEvents?: string[]
  }>(),
  
  // Delivery Preferences
  deliveryMethods: jsonb("delivery_methods").$type<{
    inApp: boolean,
    email: boolean,
    sms: boolean
  }>(),
  
  // Priority and Settings
  priority: varchar("priority", { length: 10 }).default("medium").notNull(), // "high", "medium", "low"
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Research Results
export const researchResults = pgTable("research_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  preferenceId: integer("preference_id").references(() => researchPreferences.id).notNull(),
  scheduleId: integer("schedule_id").references(() => researchSchedules.id),
  
  // Result Type and Format
  resultType: varchar("result_type", { length: 20 }).notNull(), // "insight", "alert", "digest", "report"
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  
  // Detailed Content
  content: jsonb("content").notNull(), // Full research findings
  
  // Sources and Metadata
  sources: jsonb("sources").$type<{
    url?: string,
    title?: string,
    author?: string,
    publishedAt?: string
  }[]>(),
  
  analysisMetadata: jsonb("analysis_metadata").$type<{
    sentimentScore?: number,
    confidence?: number,
    impactEstimate?: string,
    relatedAssets?: string[]
  }>(),
  
  // Status
  isRead: boolean("is_read").default(false).notNull(),
  isSaved: boolean("is_saved").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // For Time series tracking
  relevantDate: timestamp("relevant_date").defaultNow().notNull(),
});

// Alert History
export const alertHistory = pgTable("alert_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  configId: integer("config_id").references(() => alertConfig.id).notNull(),
  resultId: integer("result_id").references(() => researchResults.id).notNull(),
  
  // Alert Details
  alertType: varchar("alert_type", { length: 20 }).notNull(), // "sentiment", "volume", "price", "event"
  message: text("message").notNull(),
  
  // Delivery Status
  deliveredVia: jsonb("delivered_via").$type<string[]>(), // ["inApp", "email", "sms"]
  
  // Status
  isRead: boolean("is_read").default(false).notNull(),
  isActioned: boolean("is_actioned").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const researchPreferencesRelations = relations(researchPreferences, ({ one, many }) => ({
  user: one(users, {
    fields: [researchPreferences.userId],
    references: [users.id],
  }),
  schedules: many(researchSchedules),
  alerts: many(alertConfig),
  results: many(researchResults),
}));

export const researchSchedulesRelations = relations(researchSchedules, ({ one, many }) => ({
  user: one(users, {
    fields: [researchSchedules.userId],
    references: [users.id],
  }),
  preference: one(researchPreferences, {
    fields: [researchSchedules.preferenceId],
    references: [researchPreferences.id],
  }),
  results: many(researchResults),
}));

export const alertConfigRelations = relations(alertConfig, ({ one, many }) => ({
  user: one(users, {
    fields: [alertConfig.userId],
    references: [users.id],
  }),
  preference: one(researchPreferences, {
    fields: [alertConfig.preferenceId],
    references: [researchPreferences.id],
  }),
  alertHistory: many(alertHistory),
}));

export const researchResultsRelations = relations(researchResults, ({ one, many }) => ({
  user: one(users, {
    fields: [researchResults.userId],
    references: [users.id],
  }),
  preference: one(researchPreferences, {
    fields: [researchResults.preferenceId],
    references: [researchPreferences.id],
  }),
  schedule: one(researchSchedules, {
    fields: [researchResults.scheduleId],
    references: [researchSchedules.id],
  }),
  alerts: many(alertHistory),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  user: one(users, {
    fields: [alertHistory.userId],
    references: [users.id],
  }),
  config: one(alertConfig, {
    fields: [alertHistory.configId],
    references: [alertConfig.id],
  }),
  result: one(researchResults, {
    fields: [alertHistory.resultId],
    references: [researchResults.id],
  }),
}));

// Schema Types
export type SelectResearchPreference = typeof researchPreferences.$inferSelect;
export type InsertResearchPreference = typeof researchPreferences.$inferInsert;

export type SelectResearchSchedule = typeof researchSchedules.$inferSelect;
export type InsertResearchSchedule = typeof researchSchedules.$inferInsert;

export type SelectAlertConfig = typeof alertConfig.$inferSelect;
export type InsertAlertConfig = typeof alertConfig.$inferInsert;

export type SelectResearchResult = typeof researchResults.$inferSelect;
export type InsertResearchResult = typeof researchResults.$inferInsert;

export type SelectAlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

// Schemas for validation
export const insertResearchPreferenceSchema = createInsertSchema(researchPreferences);
export const selectResearchPreferenceSchema = createSelectSchema(researchPreferences);

export const insertResearchScheduleSchema = createInsertSchema(researchSchedules);
export const selectResearchScheduleSchema = createSelectSchema(researchSchedules);

export const insertAlertConfigSchema = createInsertSchema(alertConfig);
export const selectAlertConfigSchema = createSelectSchema(alertConfig);

export const insertResearchResultSchema = createInsertSchema(researchResults);
export const selectResearchResultSchema = createSelectSchema(researchResults);

export const insertAlertHistorySchema = createInsertSchema(alertHistory);
export const selectAlertHistorySchema = createSelectSchema(alertHistory); 