import "server-only";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db, schema } from "@/server/db";

// ---------- tokens ----------

/** 256-bit random token, URL-safe. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Tokens are stored hashed; a fast hash is fine because the tokens have 256 bits of entropy. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // no 0/O, 1/I/L

/** Human-friendly, unguessable order number, e.g. STN-7KQ4M2XA. */
export function randomOrderNumber(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const byte of bytes) out += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
  return `STN-${out}`;
}

// ---------- passwords (scrypt, per OWASP guidance) ----------

const SCRYPT = { N: 2 ** 16, r: 8, p: 1, keyLength: 64 };
const SCRYPT_MAXMEM = 256 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize("NFKC"), salt, keyLength, { ...options, maxmem: SCRYPT_MAXMEM }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.keyLength, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, saltB64, keyB64] = stored.split("$");
  if (algorithm !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Burns the same time as a real check, so "no such account" can't be told apart by timing. */
let dummyHash: Promise<string> | undefined;
export async function fakePasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword(randomToken());
  await verifyPassword(password, await dummyHash);
}

// ---------- request info ----------

/**
 * Client IP for rate limiting. On Vercel and most proxies the left-most x-forwarded-for
 * entry is set by the platform. Only used in hashed form.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// ---------- rate limiting (fixed window, stored in Postgres so it works across instances) ----------

export class RateLimitError extends Error {
  constructor() {
    super("Too many attempts. Please wait a few minutes and try again.");
  }
}

/**
 * Counts one attempt for `bucket` + `identifier` and throws RateLimitError when more than
 * `limit` attempts happen within `windowSeconds`.
 */
export async function rateLimit(bucket: string, identifier: string, limit: number, windowSeconds: number) {
  const key = `${bucket}:${hashToken(identifier.toLowerCase())}`;
  const window = sql.raw(`interval '${Math.floor(windowSeconds)} seconds'`);
  const rows = await db()
    .insert(schema.rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`case when ${schema.rateLimits.windowStart} < now() - ${window} then 1 else ${schema.rateLimits.count} + 1 end`,
        windowStart: sql`case when ${schema.rateLimits.windowStart} < now() - ${window} then now() else ${schema.rateLimits.windowStart} end`,
      },
    })
    .returning({ count: schema.rateLimits.count });

  // Occasionally clear out old windows so the table stays small.
  if (Math.random() < 0.01) {
    await db().delete(schema.rateLimits).where(sql`${schema.rateLimits.windowStart} < now() - interval '1 day'`);
  }

  if ((rows[0]?.count ?? 0) > limit) throw new RateLimitError();
}

// ---------- output safety ----------

/** Escapes text for HTML emails. Every user-supplied value in an email goes through this. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips CR/LF so values can't inject extra headers (email subjects, reply-to). */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
