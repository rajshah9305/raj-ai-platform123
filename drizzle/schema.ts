import {
  serial,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * NLP tasks submitted by users
 */
export const taskTypeEnum = pgEnum("taskType", [
  "summarization",
  "analysis",
  "research",
  "content_generation",
  "code_generation",
  "translation",
  "custom",
]);

export const statusEnum = pgEnum("status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const nlpTasks = pgTable("nlp_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  taskType: taskTypeEnum("taskType").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  inputData: text("inputData").notNull(),
  outputData: text("outputData"),
  agentConfig: text("agentConfig"),
  errorMessage: text("errorMessage"),
  processingTime: integer("processingTime"),
  tokensUsed: integer("tokensUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type NlpTask = typeof nlpTasks.$inferSelect;
export type InsertNlpTask = typeof nlpTasks.$inferInsert;

/**
 * Agent configurations and templates
 */
export const agentTypeEnum = pgEnum("agentType", [
  "researcher",
  "writer",
  "analyst",
  "summarizer",
  "coder",
  "translator",
  "custom",
]);

export const agentConfigs = pgTable("agent_configs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  agentType: agentTypeEnum("agentType").notNull(),
  systemPrompt: text("systemPrompt").notNull(),
  temperature: integer("temperature").default(100).notNull(),
  maxTokens: integer("maxTokens").default(8192).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: integer("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type InsertAgentConfig = typeof agentConfigs.$inferInsert;

/**
 * Task execution logs for debugging and analytics
 */
export const logLevelEnum = pgEnum("logLevel", [
  "info",
  "warning",
  "error",
  "debug",
]);

export const taskLogs = pgTable("task_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  agentName: varchar("agentName", { length: 255 }).notNull(),
  logLevel: logLevelEnum("logLevel").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = typeof taskLogs.$inferInsert;

/**
 * User preferences and settings
 */
export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  defaultAgentConfig: integer("defaultAgentConfig"),
  theme: themeEnum("theme").default("system").notNull(),
  defaultTaskType: varchar("defaultTaskType", { length: 64 }),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  autoSaveResults: boolean("autoSaveResults").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Saved results and exports
 */
export const formatEnum = pgEnum("format", ["json", "markdown", "text", "pdf"]);

export const savedResults = pgTable("saved_results", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  taskId: integer("taskId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  format: formatEnum("format").notNull(),
  fileUrl: text("fileUrl"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedResult = typeof savedResults.$inferSelect;
export type InsertSavedResult = typeof savedResults.$inferInsert;
