// Gives an existing account admin access to /admin.
// Usage: npm run make-admin -- someone@example.com
// The person must sign up on the website first. Run with --remove to take admin away.
// With a local PGlite database (DATABASE_URL=pglite:...), stop `npm run dev` first.
import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });

const args = process.argv.slice(2);
const remove = args.includes("--remove");
const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();
const url = process.env.DATABASE_URL;

if (!email) {
  console.error("Usage: npm run make-admin -- someone@example.com [--remove]");
  process.exit(1);
}
if (!url) {
  console.error("DATABASE_URL is not set (put it in .env.local).");
  process.exit(1);
}

/** Runs a parameterised query on either PGlite (local) or PostgreSQL. */
async function connect() {
  if (url.startsWith("pglite:")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite(url.slice("pglite:".length));
    return { query: async (text, params) => (await pg.query(text, params)).rows, close: () => pg.close() };
  }
  const sql = postgres(url, { max: 1, prepare: false });
  return { query: (text, params) => sql.unsafe(text, params), close: () => sql.end() };
}

const db = await connect();
try {
  const role = remove ? "customer" : "admin";
  const rows = await db.query("update users set role = $1::user_role, updated_at = now() where email = $2 returning email", [role, email]);
  if (rows.length === 0) {
    console.error(`No account found for ${email}. Sign up on the website first.`);
    process.exitCode = 1;
  } else {
    // Sign the user out everywhere so the new role applies with a fresh session.
    await db.query("delete from sessions where user_id = (select id from users where email = $1)", [email]);
    console.log(`${email} is now ${remove ? "a regular customer" : "an admin"}. Sign in again to use /admin.`);
  }
} finally {
  await db.close();
}
