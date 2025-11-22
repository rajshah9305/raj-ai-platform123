#!/usr/bin/env tsx
/**
 * Database initialization script
 * This script ensures the database schema is up to date and creates the default user
 * Run this during Vercel build or manually before deployment
 */

import { getDb, ensureDefaultUser } from "../server/db";

async function initDatabase() {
  console.log("[DB Init] Starting database initialization...");

  try {
    // Test database connection
    const db = await getDb();
    if (!db) {
      console.error(
        "[DB Init] ❌ Database connection failed - DATABASE_URL not set or invalid"
      );
      process.exit(1);
    }

    console.log("[DB Init] ✓ Database connection established");

    // Ensure default user exists
    console.log("[DB Init] Ensuring default user exists...");
    await ensureDefaultUser();
    console.log("[DB Init] ✓ Default user verified");

    console.log("[DB Init] ✅ Database initialization complete");
    process.exit(0);
  } catch (error) {
    console.error("[DB Init] ❌ Database initialization failed:", error);
    if (error instanceof Error) {
      console.error("[DB Init] Error message:", error.message);
      console.error("[DB Init] Error stack:", error.stack);
    }
    process.exit(1);
  }
}

initDatabase();
