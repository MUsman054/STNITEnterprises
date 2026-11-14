import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/server/env";
import * as schema from "./schema";

type Db = ReturnType<typeof createDb>;

function createDb() {
  const client = postgres(requireEnv("DATABASE_URL"), {
    // Small pool: serverless functions run many instances, each with its own pool.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Works with transaction-mode poolers (Neon, Supabase, PgBouncer).
    prepare: false,
  });
  return drizzle(client, { schema });
}

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __stnDb?: Db };

/** Lazily connects, so pages that never touch the database build without DATABASE_URL. */
export function db(): Db {
  if (!globalForDb.__stnDb) globalForDb.__stnDb = createDb();
  return globalForDb.__stnDb;
}

export { schema };
