// Runs at the start of `npm run build` (on Vercel the build command runs `npm run db:migrate`
// first, so the owner role already exists). Without BOOTSTRAP_OWNER_EMAIL it does nothing.
//
// Production database credentials are Secret variables on Vercel, so they can't be read from a
// laptop to run `npm run make-admin`. For the very first owner, set BOOTSTRAP_OWNER_EMAIL on
// Vercel and redeploy: that existing account becomes the owner, but ONLY while the store has no
// owner at all. Once an owner exists this does nothing, so leaving the variable set can't be
// used to take over the store later. Remove the variable after the first owner is set; the
// owner adds everyone else from /admin/team.
import postgres from "postgres";

const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
const url = process.env.DATABASE_URL;

if (!email) process.exit(0);
if (!url || url.startsWith("pglite:")) {
  console.log("[bootstrap-owner] skipped: no hosted DATABASE_URL.");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false });
try {
  await sql.begin(async (tx) => {
    // Serialise concurrent builds so two can't both decide "no owner yet".
    await tx`select pg_advisory_xact_lock(hashtext('stn-bootstrap-owner'))`;
    const [{ owners }] = await tx`select count(*)::int as owners from users where role = 'owner'`;
    if (owners > 0) {
      console.log("[bootstrap-owner] an owner already exists; nothing to do. You can remove BOOTSTRAP_OWNER_EMAIL.");
      return;
    }
    const rows = await tx`update users set role = 'owner', updated_at = now() where email = ${email} returning email`;
    if (rows.length === 0) {
      console.log(`[bootstrap-owner] no account for ${email} yet. Sign up on the website, then redeploy.`);
      return;
    }
    await tx`delete from sessions where user_id = (select id from users where email = ${email})`;
    console.log(`[bootstrap-owner] ${email} is now the store owner. Sign in again to use /admin. Remove BOOTSTRAP_OWNER_EMAIL now.`);
  });
} finally {
  await sql.end();
}
