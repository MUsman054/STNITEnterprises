import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL ?? "";
const isPglite = url.startsWith("pglite:");
if (isPglite) mkdirSync(dirname(url.slice("pglite:".length)), { recursive: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  // Local development: PGlite database folder. Otherwise: a normal PostgreSQL connection string.
  ...(isPglite ? { driver: "pglite" as const, dbCredentials: { url: url.slice("pglite:".length) } } : { dbCredentials: { url } }),
  strict: true,
  verbose: true,
});
