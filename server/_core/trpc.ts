import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// protectedProcedure is now just an alias for publicProcedure since auth is removed
export const protectedProcedure = t.procedure;

// adminProcedure is now just an alias for publicProcedure since auth is removed
export const adminProcedure = t.procedure;
