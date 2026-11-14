import "server-only";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/server/env";
import * as schema from "./schema";

/**
 * Database connection.
 *
 * - Production / any real PostgreSQL: DATABASE_URL=postgres://...
 * - Local development without installing Postgres: DATABASE_URL=pglite:./.data/pglite
 *   runs PostgreSQL (PGlite) inside the Next.js process, saved in that folder. Only one
 *   process may open it at a time, so stop `npm run dev` before running db:migrate or
 *   make-admin.
 */

function createPostgresDb(url: string) {
  const client = postgres(url, {
    // Small pool: serverless functions run many instances, each with its own pool.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Works with transaction-mode poolers (Neon, Supabase, PgBouncer).
    prepare: false,
  });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof createPostgresDb>;

function createDb(): Db {
  const url = requireEnv("DATABASE_URL");
  if (url.startsWith("pglite:")) {
    // On Vercel the filesystem is temporary: every order would be lost. Refuse loudly.
    if (process.env.VERCEL) {
      throw new Error("DATABASE_URL points to a local PGlite database. Use a hosted PostgreSQL database (e.g. Neon) on Vercel.");
    }
    // Same query API; the two drivers differ only in their raw result types.
    return drizzlePglite(new PGlite(url.slice("pglite:".length)), { schema }) as unknown as Db;
  }
  return createPostgresDb(url);
}

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __stnDb?: Db };

/** Lazily connects, so pages that never touch the database build without DATABASE_URL. */
export function db(): Db {
  if (!globalForDb.__stnDb) globalForDb.__stnDb = createDb();
  return globalForDb.__stnDb;
}

export { schema };
