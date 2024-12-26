import { pgTable, text, serial, integer, timestamp, jsonb, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  hasPlaidSetup: boolean("has_plaid_setup").default(false).notNull(),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false).notNull(),
  monthlyIncome: integer("monthly_income").default(0).notNull(),
  onboardingStep: integer("onboarding_step").default(1).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  rememberToken: text("remember_token"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  legalConsent: jsonb("legal_consent").default(null),
  consentVersion: varchar("consent_version", { length: 10 }).default(null),
});

export const plaidItems = pgTable("plaid_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  plaidItemId: text("plaid_item_id").unique().notNull(),
  plaidAccessToken: text("plaid_access_token").notNull(),
  plaidInstitutionId: text("plaid_institution_id").notNull(),
  plaidInstitutionName: text("plaid_institution_name").notNull(),
  status: text("status").notNull().default("active"),
  lastSync: timestamp("last_sync"),
  isDefault: boolean("is_default").default(false).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add unique constraint to ensure one default item per user
export const plaidItemsConstraints = pgTable("plaid_items_constraints", {
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  defaultItemId: integer("default_item_id").references(() => plaidItems.id),
});

export const plaidAccounts = pgTable("plaid_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  plaidItemId: integer("plaid_item_id").references(() => plaidItems.id).notNull(),
  plaidAccountId: text("plaid_account_id").unique().notNull(),
  name: text("name").notNull(),
  mask: text("mask"),
  type: text("type").notNull(),
  subtype: text("subtype"),
  currentBalance: integer("current_balance").notNull(),
  availableBalance: integer("available_balance"),
  isoCurrencyCode: text("iso_currency_code"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plaidTransactions = pgTable("plaid_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accountId: integer("account_id").references(() => plaidAccounts.id).notNull(),
  plaidTransactionId: text("plaid_transaction_id").unique().notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  merchantName: text("merchant_name"),
  description: text("description").notNull(),
  pending: boolean("pending").default(false).notNull(),
  date: timestamp("date").notNull(),
  authorizedDate: timestamp("authorized_date"),
  paymentChannel: text("payment_channel"),
  isoCurrencyCode: text("iso_currency_code"),
  location: jsonb("location"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  plaidItems: many(plaidItems),
  plaidAccounts: many(plaidAccounts),
  plaidTransactions: many(plaidTransactions),
  insights: many(insights),
}));

export const plaidItemsRelations = relations(plaidItems, ({ one, many }) => ({
  user: one(users, {
    fields: [plaidItems.userId],
    references: [users.id],
  }),
  accounts: many(plaidAccounts),
}));

export const plaidAccountsRelations = relations(plaidAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [plaidAccounts.userId],
    references: [users.id],
  }),
  item: one(plaidItems, {
    fields: [plaidAccounts.plaidItemId],
    references: [plaidItems.id],
  }),
  transactions: many(plaidTransactions),
}));

export const plaidTransactionsRelations = relations(plaidTransactions, ({ one }) => ({
  user: one(users, {
    fields: [plaidTransactions.userId],
    references: [users.id],
  }),
  account: one(plaidAccounts, {
    fields: [plaidTransactions.accountId],
    references: [plaidAccounts.id],
  }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(users, {
    fields: [insights.userId],
    references: [users.id],
  }),
}));

// User Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Insight Schemas
export const insertInsightSchema = createInsertSchema(insights);
export const selectInsightSchema = createSelectSchema(insights);

// Plaid Schemas
export const insertPlaidItemSchema = createInsertSchema(plaidItems);
export const selectPlaidItemSchema = createSelectSchema(plaidItems);

export const insertPlaidAccountSchema = createInsertSchema(plaidAccounts);
export const selectPlaidAccountSchema = createSelectSchema(plaidAccounts);

export const insertPlaidTransactionSchema = createInsertSchema(plaidTransactions);
export const selectPlaidTransactionSchema = createSelectSchema(plaidTransactions);

// Types
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type SelectInsight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

// Plaid Types
export type SelectPlaidItem = typeof plaidItems.$inferSelect;
export type InsertPlaidItem = typeof plaidItems.$inferInsert;

export type SelectPlaidAccount = typeof plaidAccounts.$inferSelect;
export type InsertPlaidAccount = typeof plaidAccounts.$inferInsert;

export type SelectPlaidTransaction = typeof plaidTransactions.$inferSelect;
export type InsertPlaidTransaction = typeof plaidTransactions.$inferInsert;

// Financial Goals
// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  period: text("period").notNull().default("monthly"),
  startDate: timestamp("start_date").notNull(),
  category: text("category").notNull(),
  spendingLimit: integer("spending_limit").notNull(),
  spent: integer("spent").default(0).notNull(),
  alertThreshold: integer("alert_threshold").default(80).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export const insertBudgetSchema = createInsertSchema(budgets);
export const selectBudgetSchema = createSelectSchema(budgets);

export type SelectBudget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // savings, investment, custom
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").default(0).notNull(),
  deadline: timestamp("deadline"),
  status: text("status").default("in_progress").notNull(), // in_progress, completed, paused
  category: text("category").notNull(), // emergency_fund, retirement, house, education, etc.
  description: text("description"),
  aiSuggestions: jsonb("ai_suggestions"), // Store AI-generated suggestions and insights
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const insertGoalSchema = createInsertSchema(goals);
export const selectGoalSchema = createSelectSchema(goals);

export type SelectGoal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;