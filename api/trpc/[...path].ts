import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import { ensureDefaultUser, getDb } from "../../server/db";

// Ensure default user exists (only runs once per serverless function instance)
let defaultUserEnsured = false;
let dbConnectionTested = false;

// Vercel serverless function wrapper for tRPC
export default async function handler(req: Request): Promise<Response> {
  // Test database connection on first request
  if (!dbConnectionTested) {
    try {
      const db = await getDb();
      if (db) {
        console.log("[Serverless] ✓ Database connection verified");
        dbConnectionTested = true;

        // Ensure default user exists
        if (!defaultUserEnsured) {
          try {
            await ensureDefaultUser();
            console.log("[Serverless] ✓ Default user ensured");
            defaultUserEnsured = true;
          } catch (error) {
            console.error("[Serverless] Failed to ensure default user:", error);
            // Continue anyway - the user might already exist
          }
        }
      } else {
        console.error(
          "[Serverless] ❌ Database connection failed - DATABASE_URL may be missing or invalid"
        );
      }
    } catch (error) {
      console.error("[Serverless] ❌ Database connection error:", error);
      if (error instanceof Error) {
        console.error("[Serverless] Error message:", error.message);
      }
    }
  }

  return fetchRequestHandler({
    router: appRouter,
    req,
    endpoint: "/api/trpc",
    createContext: async () => {
      // Create a minimal context for Vercel serverless
      return {
        req: req as any,
        res: {} as any,
      };
    },
    onError: ({ error, path }) => {
      console.error(`[tRPC] Error on '${path}':`, error);
      console.error(`[tRPC] Error message:`, error.message);
      console.error(`[tRPC] Error stack:`, error.stack);
    },
  });
}
