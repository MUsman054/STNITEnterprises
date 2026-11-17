// Fills a database with SAMPLE reviews (1 to 5 per product) so the review pages can be
// tested and demoed. They are not real customer reviews: remove them before the store launches.
// All of them belong to accounts ending in @sample.invalid, so --remove deletes every one.
//
// Usage (with a local PGlite database, stop `npm run dev` first):
//   npm run sample-reviews             -> add sample reviews (re-running replaces them)
//   npm run sample-reviews -- --remove -> delete all sample reviews and sample accounts
// A hosted PostgreSQL database (e.g. the Vercel/Neon one) also needs --live, on purpose:
//   DATABASE_URL=postgres://... npm run sample-reviews -- --live
//   DATABASE_URL=postgres://... npm run sample-reviews -- --live --remove
import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL ?? "";
const isLocal = url.startsWith("pglite:");
if (!url || (!isLocal && !process.argv.includes("--live"))) {
  console.error("Refusing to run: this is not the local PGlite database. Add --live if you really mean the hosted database.");
  process.exit(1);
}

const { products } = await import("../src/lib/catalog.ts");

/** Same parameterised-query API on PGlite (local) and PostgreSQL. */
async function connect() {
  if (isLocal) {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite(url.slice("pglite:".length));
    return { query: async (text, params) => ({ rows: (await pg.query(text, params)).rows }), close: () => pg.close() };
  }
  const sql = postgres(url, { max: 1, prepare: false });
  return { query: async (text, params) => ({ rows: await sql.unsafe(text, params) }), close: () => sql.end() };
}

const db = await connect();
const SAMPLE_DOMAIN = "@sample.invalid";

// Always start clean so re-running doesn't pile up duplicates.
await db.query(`delete from users where email like $1`, [`%${SAMPLE_DOMAIN}`]);
if (process.argv.includes("--remove")) {
  console.log("Removed all sample reviews.");
  await db.close();
  process.exit(0);
}

const people = [
  "James Carter", "Maria Lopez", "Ahmed Khan", "Emily Chen", "Robert Miller", "Sarah Johnson", "David Kim", "Priya Patel",
  "Michael Brown", "Jessica Davis", "Daniel Wilson", "Ayesha Malik", "Chris Thompson", "Laura Martinez", "Kevin Nguyen",
  "Rachel Green", "Omar Farooq", "Brian Scott", "Nicole Adams", "Steven Clark",
];

const texts = {
  5: [
    ["Exactly as described", "Arrived well packed and worked first time. Part number matched our existing units exactly."],
    ["Great supplier", "Third order with STN and every part has been tested and labelled properly. Fast shipping too."],
    ["Works perfectly", "Installed it the same day it arrived. No errors after a week of running in production."],
    [null, "Excellent condition, looked almost new. Support answered my compatibility question within an hour."],
    ["Saved our project", "Hard-to-find part and they had it in stock. Shipped quickly and well protected."],
  ],
  4: [
    ["Good value", "Works as expected. Minor cosmetic marks on the refurbished unit but nothing that affects use."],
    [null, "Solid part at a fair price. Shipping took a day longer than estimated but everything was fine."],
    ["Does the job", "Running without issues in our lab. Packaging could have been a little better."],
  ],
  3: [
    ["OK overall", "The part works, but it took a while to arrive and tracking updates were slow."],
  ],
  2: [
    ["Had to RMA", "First unit had a fault. The RMA process was straightforward and the replacement works."],
  ],
};

/** Stable pseudo-random numbers from a string, so the same product always gets the same sample set. */
function rng(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>>= 0) % 10000) / 10000;
  };
}

const userIds = [];
for (const [i, name] of people.entries()) {
  const rows = await db.query(`insert into users (email, name) values ($1, $2) returning id`, [`sample${i}${SAMPLE_DOMAIN}`, name]);
  userIds.push(rows.rows[0].id);
}

let total = 0;
for (const product of products) {
  const random = rng(product.slug);
  const count = 1 + Math.floor(random() * 5); // 1 to 5 reviews
  const order = [...people.keys()].sort(() => random() - 0.5).slice(0, count);
  for (const who of order) {
    const roll = random();
    const rating = roll < 0.55 ? 5 : roll < 0.85 ? 4 : roll < 0.95 ? 3 : 2;
    const pool = texts[rating];
    const [title, body] = pool[Math.floor(random() * pool.length)];
    const [first, ...rest] = people[who].split(" ");
    const daysAgo = Math.floor(random() * 300) + 1;
    await db.query(
      `insert into reviews (product_slug, user_id, rating, title, body, author_name, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, now() - ($7 || ' days')::interval, now() - ($7 || ' days')::interval)`,
      [product.slug, userIds[who], rating, title, body, `${first} ${rest.at(-1)[0]}.`, String(daysAgo)],
    );
    total++;
  }
}

console.log(`Added ${total} sample reviews to ${products.length} products (${isLocal ? "local" : "hosted"} database).`);
await db.close();
