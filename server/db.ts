import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import {
  InsertUser,
  User,
  users,
  nlpTasks,
  InsertNlpTask,
  NlpTask,
  agentConfigs,
  InsertAgentConfig,
  AgentConfig,
  taskLogs,
  InsertTaskLog,
  TaskLog,
  userPreferences,
  InsertUserPreference,
  UserPreference,
  savedResults,
  InsertSavedResult,
  SavedResult,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let forceInMemoryDb = false;
let hasLoggedInMemoryFallback = false;

const IN_MEMORY_DEFAULT_USER_ID = 1;

type InMemoryState = {
  users: User[];
  nlpTasks: NlpTask[];
  agentConfigs: AgentConfig[];
  taskLogs: TaskLog[];
  userPreferences: UserPreference[];
  savedResults: SavedResult[];
};

const inMemoryState: InMemoryState = {
  users: [],
  nlpTasks: [],
  agentConfigs: [],
  taskLogs: [],
  userPreferences: [],
  savedResults: [],
};

const idCounters = {
  users: IN_MEMORY_DEFAULT_USER_ID + 1,
  nlpTasks: 1,
  agentConfigs: 1,
  taskLogs: 1,
  userPreferences: 1,
  savedResults: 1,
};

function shouldBypassDatabase() {
  return (
    forceInMemoryDb ||
    process.env.USE_IN_MEMORY_DB === "true" ||
    process.env.NODE_ENV === "test"
  );
}

function logInMemoryUsage(reason?: string) {
  if (!hasLoggedInMemoryFallback) {
    const suffix = reason ? ` (${reason})` : "";
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Database] Falling back to in-memory store${suffix}`);
    }
    hasLoggedInMemoryFallback = true;
  }
}

function toDate(value?: Date | string | null): Date {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

function toNullableDate(value?: Date | string | null): Date | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value : new Date(value);
}

function nextId(counter: keyof typeof idCounters) {
  const id = idCounters[counter];
  idCounters[counter] += 1;
  return id;
}

function ensureInMemoryDefaultUser() {
  const existing = inMemoryState.users.find(
    user => user.id === IN_MEMORY_DEFAULT_USER_ID
  );
  if (existing) return;

  const now = new Date();
  inMemoryState.users.push({
    id: IN_MEMORY_DEFAULT_USER_ID,
    openId: "default-user-no-auth",
    name: "Default User",
    email: "default@example.com",
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  });
}

function inMemoryUpsertUser(user: InsertUser): void {
  const targetIndex = inMemoryState.users.findIndex(
    u => u.openId === user.openId
  );
  const existing = targetIndex >= 0 ? inMemoryState.users[targetIndex] : null;
  const now = new Date();

  const normalized: User = {
    id: existing?.id ?? nextId("users"),
    openId: user.openId,
    name: user.name ?? existing?.name ?? null,
    email: user.email ?? existing?.email ?? null,
    loginMethod: user.loginMethod ?? existing?.loginMethod ?? null,
    role: user.role ?? existing?.role ?? "user",
    createdAt: existing?.createdAt ?? toDate(user.createdAt) ?? now,
    updatedAt: toDate(user.updatedAt) ?? now,
    lastSignedIn: user.lastSignedIn ? toDate(user.lastSignedIn) : now,
  };

  if (existing) {
    inMemoryState.users[targetIndex] = {
      ...existing,
      ...normalized,
      createdAt: existing.createdAt,
    };
  } else {
    inMemoryState.users.push(normalized);
  }
}

function withTaskDefaults(task: InsertNlpTask, id: number): NlpTask {
  const now = new Date();
  return {
    id,
    userId: task.userId ?? IN_MEMORY_DEFAULT_USER_ID,
    title: task.title!,
    description: task.description!,
    taskType: task.taskType!,
    status: task.status ?? "pending",
    priority: task.priority ?? "medium",
    inputData: task.inputData!,
    outputData: task.outputData ?? null,
    agentConfig: task.agentConfig ?? null,
    errorMessage: task.errorMessage ?? null,
    processingTime: task.processingTime ?? null,
    tokensUsed: task.tokensUsed ?? null,
    createdAt: task.createdAt ? toDate(task.createdAt) : now,
    updatedAt: task.updatedAt ? toDate(task.updatedAt) : now,
    completedAt: toNullableDate(task.completedAt),
  };
}

function withAgentConfigDefaults(
  config: InsertAgentConfig,
  id: number
): AgentConfig {
  const now = new Date();
  return {
    id,
    userId: config.userId ?? IN_MEMORY_DEFAULT_USER_ID,
    name: config.name!,
    description: config.description ?? null,
    agentType: config.agentType!,
    systemPrompt: config.systemPrompt!,
    temperature: config.temperature ?? 100,
    maxTokens: config.maxTokens ?? 8192,
    isPublic: config.isPublic ?? false,
    isDefault: config.isDefault ?? false,
    usageCount: config.usageCount ?? 0,
    createdAt: config.createdAt ? toDate(config.createdAt) : now,
    updatedAt: config.updatedAt ? toDate(config.updatedAt) : now,
  };
}

function withUserPreferenceDefaults(
  prefs: InsertUserPreference,
  id: number
): UserPreference {
  const now = new Date();
  return {
    id,
    userId: prefs.userId!,
    defaultAgentConfig: prefs.defaultAgentConfig ?? null,
    theme: prefs.theme ?? "system",
    defaultTaskType: prefs.defaultTaskType ?? null,
    notificationsEnabled: prefs.notificationsEnabled ?? true,
    autoSaveResults: prefs.autoSaveResults ?? true,
    createdAt: prefs.createdAt ? toDate(prefs.createdAt) : now,
    updatedAt: prefs.updatedAt ? toDate(prefs.updatedAt) : now,
  };
}

function withSavedResultDefaults(
  result: InsertSavedResult,
  id: number
): SavedResult {
  const now = new Date();
  return {
    id,
    userId: result.userId!,
    taskId: result.taskId!,
    title: result.title!,
    content: result.content!,
    format: result.format!,
    fileUrl: result.fileUrl ?? null,
    isPublic: result.isPublic ?? false,
    createdAt: result.createdAt ? toDate(result.createdAt) : now,
  };
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (shouldBypassDatabase()) {
    logInMemoryUsage("runtime configuration");
    return null;
  }

  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("[Database] ❌ DATABASE_URL environment variable is not set");
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Database] Check if .env file exists and contains DATABASE_URL"
        );
      } else if (process.env.VERCEL) {
        console.error(
          "[Database] In Vercel deployment - ensure DATABASE_URL is set in environment variables"
        );
        console.error(
          "[Database] Go to Vercel Dashboard > Project > Settings > Environment Variables"
        );
      }
      forceInMemoryDb = true;
      logInMemoryUsage("missing DATABASE_URL");
      return null;
    }
    console.log("[Database] DATABASE_URL found, attempting connection...");

    try {
      // Handle both connection string formats (with and without psql prefix)
      let connectionString = databaseUrl;
      if (connectionString.startsWith("psql ")) {
        // Remove 'psql ' prefix if present
        connectionString = connectionString.substring(5).trim();
        // Remove quotes if present
        connectionString = connectionString.replace(/^['"]|['"]$/g, "");
      }

      // Determine SSL requirement
      const requiresSSL =
        connectionString.includes("sslmode=require") ||
        connectionString.includes("neon.tech") ||
        connectionString.includes("supabase.co");

      const pool = new Pool({
        connectionString,
        ssl: connectionString.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
      });

      // Test the connection
      try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
      } catch (testError) {
        console.error("[Database] ❌ Connection test failed:", testError);
        pool.end();
        // In Vercel/production, throw error; in development, fall back to in-memory
        if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
          console.error("[Database] ❌ Production deployment requires working database connection");
          throw new Error(`Database connection failed in production: ${testError instanceof Error ? testError.message : String(testError)}`);
        } else {
          forceInMemoryDb = true;
          logInMemoryUsage("connection failure");
          return null;
        }
      }

      _db = drizzle(pool);
      if (process.env.NODE_ENV === "development") {
        console.log("[Database] ✓ Connected successfully to database");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Database] ❌ Failed to connect to database:", error);
        if (error instanceof Error) {
          console.error("[Database] Error message:", error.message);
          if ("code" in error && typeof error.code === "string") {
            console.error("[Database] Error code:", error.code);
          }
        }
      }
      _db = null;
      forceInMemoryDb = true;
      logInMemoryUsage("connection failure");
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    inMemoryUpsertUser(user);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return inMemoryState.users.find(user => user.openId === openId);
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    return inMemoryState.users.find(user => user.id === id);
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function ensureDefaultUser(): Promise<void> {
  const db = await getDb();
  if (!db) {
    ensureInMemoryDefaultUser();
    return;
  }

  try {
    const existingUser = await getUserById(1);
    if (!existingUser) {
      await upsertUser({
        openId: "default-user-no-auth",
        name: "Default User",
        email: "default@example.com",
        role: "user",
      });
      if (process.env.NODE_ENV === "development") {
        console.log("[Database] Created default user");
      }
    }
  } catch (error) {
    console.error("[Database] Failed to ensure default user:", error);
  }
}

// NLP Task operations
export async function createNlpTask(task: InsertNlpTask): Promise<NlpTask> {
  const db = await getDb();
  if (!db) {
    ensureInMemoryDefaultUser();
    const newTask = withTaskDefaults(task, nextId("nlpTasks"));
    inMemoryState.nlpTasks.push(newTask);
    return newTask;
  }

  // Validate and sanitize task data before insertion
  const taskData = {
    userId: task.userId || 1,
    title: task.title!.trim(),
    description: task.description!.trim(),
    taskType: task.taskType,
    status: task.status || "pending",
    priority: task.priority || "medium",
    inputData: task.inputData!.trim(),
    outputData: task.outputData || null,
    agentConfig: task.agentConfig || null,
    errorMessage: task.errorMessage || null,
    processingTime: task.processingTime || null,
    tokensUsed: task.tokensUsed || null,
    createdAt: task.createdAt ? toDate(task.createdAt) : new Date(),
    updatedAt: task.updatedAt ? toDate(task.updatedAt) : new Date(),
    completedAt: toNullableDate(task.completedAt),
  };

  try {
    // Ensure default user exists before creating task
    await ensureDefaultUser();

    // Validate enum values
    const validTaskTypes = [
      "summarization",
      "analysis",
      "research",
      "content_generation",
      "code_generation",
      "translation",
      "custom",
    ];
    if (!validTaskTypes.includes(taskData.taskType)) {
      throw new Error(
        `Invalid taskType: "${taskData.taskType}". Must be one of: ${validTaskTypes.join(", ")}`
      );
    }

    const validStatuses = ["pending", "processing", "completed", "failed"];
    if (!validStatuses.includes(taskData.status)) {
      throw new Error(
        `Invalid status: "${taskData.status}". Must be one of: ${validStatuses.join(", ")}`
      );
    }

    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(taskData.priority)) {
      throw new Error(
        `Invalid priority: "${taskData.priority}". Must be one of: ${validPriorities.join(", ")}`
      );
    }

    // Validate required fields
    if (!taskData.title || taskData.title.length === 0) {
      throw new Error("Title is required and cannot be empty");
    }
    if (taskData.title.length > 255) {
      throw new Error("Title cannot exceed 255 characters");
    }
    if (!taskData.description || taskData.description.length === 0) {
      throw new Error("Description is required and cannot be empty");
    }
    if (!taskData.inputData || taskData.inputData.length === 0) {
      throw new Error("Input data is required and cannot be empty");
    }
    if (!taskData.userId || taskData.userId < 1) {
      throw new Error("Valid user ID is required");
    }

    const result = await db.insert(nlpTasks).values(taskData).returning();
    if (!result[0]) {
      const error = new Error(
        "Failed to create task: No result returned from database"
      );
      console.error("[Database] Task creation failed:", error);
      throw error;
    }

    return result[0];
  } catch (error) {
    console.error("[Database] Error creating task:", error);
    if (error instanceof Error) {
      // Check if it's a PostgreSQL enum error (check various error formats)
      const errorMsg = error.message.toLowerCase();
      if (
        errorMsg.includes("invalid input value for enum") ||
        errorMsg.includes("does not match the expected pattern") ||
        errorMsg.includes("invalid enum value") ||
        errorMsg.includes("string did not match") ||
        (errorMsg.includes("enum") && errorMsg.includes("pattern"))
      ) {
        console.error(
          "[Database] Enum validation error - this usually means the database enum doesn't match the schema"
        );
        console.error("[Database] Task data:", {
          taskType: taskData.taskType,
          status: taskData.status,
          priority: taskData.priority,
        });

        // Try to identify which field is causing the issue
        let fieldHint = "";
        if (errorMsg.includes("tasktype") || errorMsg.includes("task_type")) {
          fieldHint = ` The issue is with taskType: "${taskData.taskType}"`;
        } else if (errorMsg.includes("status")) {
          fieldHint = ` The issue is with status: "${taskData.status}"`;
        } else if (errorMsg.includes("priority")) {
          fieldHint = ` The issue is with priority: "${taskData.priority}"`;
        }

        const helpfulMsg = `Database enum validation failed.${fieldHint}\n\nThis usually means the database enum values don't match your code schema.\n\nTo fix this:\n1. Run: pnpm db:push\n2. Or run: pnpm db:generate && pnpm db:migrate\n\nIf the issue persists, the database may need to be recreated.`;
        throw new Error(helpfulMsg);
      }
      throw error;
    }
    throw new Error(`Failed to create task: ${String(error)}`);
  }
}

export async function updateNlpTask(
  id: number,
  updates: Partial<InsertNlpTask>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const index = inMemoryState.nlpTasks.findIndex(task => task.id === id);
    if (index === -1) {
      throw new Error("Task not found");
    }
    const current = inMemoryState.nlpTasks[index];
    const updatedAtValue = updates.updatedAt
      ? toDate(updates.updatedAt)
      : new Date();
    const completedAtValue =
      updates.completedAt === undefined
        ? current.completedAt
        : toNullableDate(updates.completedAt);

    inMemoryState.nlpTasks[index] = {
      ...current,
      ...updates,
      status: updates.status ?? current.status,
      priority: updates.priority ?? current.priority,
      updatedAt: updatedAtValue,
      completedAt: completedAtValue,
    };
    return;
  }

  await db.update(nlpTasks).set(updates).where(eq(nlpTasks.id, id));
}

export async function getNlpTaskById(id: number): Promise<NlpTask | undefined> {
  const db = await getDb();
  if (!db) {
    return inMemoryState.nlpTasks.find(task => task.id === id);
  }

  const result = await db
    .select()
    .from(nlpTasks)
    .where(eq(nlpTasks.id, id))
    .limit(1);
  return result[0];
}

export async function getUserNlpTasks(
  userId: number,
  limit: number = 50
): Promise<NlpTask[]> {
  const db = await getDb();
  const pageSize = limit ?? 50;
  if (!db) {
    return inMemoryState.nlpTasks
      .filter(task => task.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, pageSize);
  }

  return db
    .select()
    .from(nlpTasks)
    .where(eq(nlpTasks.userId, userId))
    .orderBy(desc(nlpTasks.createdAt))
    .limit(pageSize);
}

export async function deleteNlpTask(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const index = inMemoryState.nlpTasks.findIndex(
      task => task.id === id && task.userId === userId
    );
    if (index === -1) throw new Error("Task not found");
    inMemoryState.nlpTasks.splice(index, 1);
    return;
  }

  await db
    .delete(nlpTasks)
    .where(and(eq(nlpTasks.id, id), eq(nlpTasks.userId, userId)));
}

// Agent Config operations
export async function createAgentConfig(
  config: InsertAgentConfig
): Promise<AgentConfig> {
  const db = await getDb();
  if (!db) {
    const newConfig = withAgentConfigDefaults(config, nextId("agentConfigs"));
    inMemoryState.agentConfigs.push(newConfig);
    return newConfig;
  }

  const result = await db.insert(agentConfigs).values(config).returning();
  if (!result[0]) throw new Error("Failed to create agent config");

  return result[0];
}

export async function getUserAgentConfigs(
  userId: number
): Promise<AgentConfig[]> {
  const db = await getDb();
  if (!db) {
    return inMemoryState.agentConfigs
      .filter(config => config.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.userId, userId))
    .orderBy(desc(agentConfigs.createdAt));
}

export async function getPublicAgentConfigs(): Promise<AgentConfig[]> {
  const db = await getDb();
  if (!db) {
    return inMemoryState.agentConfigs
      .filter(config => config.isPublic)
      .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
  }

  return db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.isPublic, true))
    .orderBy(desc(agentConfigs.usageCount));
}

export async function incrementAgentConfigUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    const config = inMemoryState.agentConfigs.find(cfg => cfg.id === id);
    if (config) {
      config.usageCount = (config.usageCount ?? 0) + 1;
      config.updatedAt = new Date();
    }
    return;
  }

  const config = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.id, id))
    .limit(1);
  if (config[0]) {
    await db
      .update(agentConfigs)
      .set({ usageCount: (config[0].usageCount || 0) + 1 })
      .where(eq(agentConfigs.id, id));
  }
}

// Task Log operations
export async function createTaskLog(log: InsertTaskLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    const newLog: TaskLog = {
      id: nextId("taskLogs"),
      taskId: log.taskId!,
      agentName: log.agentName!,
      logLevel: log.logLevel!,
      message: log.message!,
      metadata: log.metadata ?? null,
      createdAt: log.createdAt ? toDate(log.createdAt) : new Date(),
    };
    inMemoryState.taskLogs.push(newLog);
    return;
  }

  await db.insert(taskLogs).values(log);
}

export async function getTaskLogs(taskId: number): Promise<TaskLog[]> {
  const db = await getDb();
  if (!db) {
    return inMemoryState.taskLogs
      .filter(log => log.taskId === taskId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return db
    .select()
    .from(taskLogs)
    .where(eq(taskLogs.taskId, taskId))
    .orderBy(desc(taskLogs.createdAt));
}

// User Preferences operations
export async function getUserPreferences(
  userId: number
): Promise<UserPreference | undefined> {
  const db = await getDb();
  if (!db) {
    return inMemoryState.userPreferences.find(pref => pref.userId === userId);
  }

  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertUserPreferences(
  prefs: InsertUserPreference
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const existingIndex = inMemoryState.userPreferences.findIndex(
      pref => pref.userId === prefs.userId
    );

    if (existingIndex >= 0) {
      const existing = inMemoryState.userPreferences[existingIndex];
      inMemoryState.userPreferences[existingIndex] = {
        ...existing,
        ...prefs,
        defaultAgentConfig:
          prefs.defaultAgentConfig !== undefined
            ? prefs.defaultAgentConfig
            : existing.defaultAgentConfig,
        theme: prefs.theme ?? existing.theme,
        defaultTaskType:
          prefs.defaultTaskType !== undefined
            ? prefs.defaultTaskType
            : existing.defaultTaskType,
        notificationsEnabled:
          prefs.notificationsEnabled ?? existing.notificationsEnabled,
        autoSaveResults: prefs.autoSaveResults ?? existing.autoSaveResults,
        updatedAt: new Date(),
      };
    } else {
      const newPref = withUserPreferenceDefaults(
        { ...prefs, createdAt: prefs.createdAt ?? new Date() },
        nextId("userPreferences")
      );
      inMemoryState.userPreferences.push(newPref);
    }
    return;
  }

  await db.insert(userPreferences).values(prefs).onConflictDoUpdate({
    target: userPreferences.userId,
    set: prefs,
  });
}

// Saved Results operations
export async function createSavedResult(
  result: InsertSavedResult
): Promise<SavedResult> {
  const db = await getDb();
  if (!db) {
    const newResult = withSavedResultDefaults(result, nextId("savedResults"));
    inMemoryState.savedResults.push(newResult);
    return newResult;
  }

  const insertResult = await db.insert(savedResults).values(result).returning();
  if (!insertResult[0]) throw new Error("Failed to create saved result");

  return insertResult[0];
}

export async function getUserSavedResults(
  userId: number
): Promise<SavedResult[]> {
  const db = await getDb();
  if (!db) {
    return inMemoryState.savedResults
      .filter(result => result.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return db
    .select()
    .from(savedResults)
    .where(eq(savedResults.userId, userId))
    .orderBy(desc(savedResults.createdAt));
}
