// Gives an existing account admin access to /admin.
// Usage: npm run make-admin -- someone@example.com
// The person must sign up on the website first. Run with --remove to take admin away.
import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });

const args = process.argv.slice(2);
const remove = args.includes("--remove");
const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- someone@example.com [--remove]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (put it in .env.local).");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const role = remove ? "customer" : "admin";
  const rows = await sql`update users set role = ${role}::user_role, updated_at = now() where email = ${email} returning email`;
  if (rows.length === 0) {
    console.error(`No account found for ${email}. Sign up on the website first.`);
    process.exitCode = 1;
  } else {
    // Sign the user out everywhere so the new role applies with a fresh session.
    await sql`delete from sessions where user_id = (select id from users where email = ${email})`;
    console.log(`${email} is now ${remove ? "a regular customer" : "an admin"}.`);
  }
} finally {
  await sql.end();
}
