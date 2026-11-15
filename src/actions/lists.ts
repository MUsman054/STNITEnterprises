"use server";

import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth";
import { db, schema } from "@/server/db";
import { mergeLists, sanitizeLists, type ShoppingLists } from "@/lib/shopping-lists";
import { rateLimit } from "@/server/security";

/**
 * Cart + wishlist for signed-in shoppers. Each action works only on the caller's own
 * account (from the session cookie, never from the input), and every list is re-checked
 * against the catalogue before it is stored or returned.
 */

type ListsResult = { ok: true; userId: string; lists: ShoppingLists } | { ok: false };

async function readLists(userId: string): Promise<ShoppingLists> {
  const [row] = await db().select().from(schema.shoppingLists).where(eq(schema.shoppingLists.userId, userId)).limit(1);
  return row ? sanitizeLists({ lines: row.cart, saved: row.saved, wishlist: row.wishlist }) : { lines: [], saved: [], wishlist: [] };
}

async function writeLists(userId: string, lists: ShoppingLists) {
  const values = { cart: lists.lines, saved: lists.saved, wishlist: lists.wishlist, updatedAt: new Date() };
  await db()
    .insert(schema.shoppingLists)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: schema.shoppingLists.userId, set: values });
}

async function run(work: (userId: string) => Promise<ShoppingLists>): Promise<ListsResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false };
    // Generous for real shopping (every click saves), but stops a script hammering the DB.
    await rateLimit("lists", user.id, 120, 60);
    return { ok: true, userId: user.id, lists: await work(user.id) };
  } catch (error) {
    console.error("[lists] failed:", error);
    return { ok: false };
  }
}

/** The account's saved lists (used on page load and when the tab regains focus). */
export async function getMyLists(): Promise<ListsResult> {
  return run(readLists);
}

/** Right after sign-in: fold the guest's browser lists into the account and return the result. */
export async function mergeGuestLists(guest: unknown): Promise<ListsResult> {
  return run(async (userId) => {
    const merged = mergeLists(await readLists(userId), sanitizeLists(guest));
    await writeLists(userId, merged);
    return merged;
  });
}

/** Replaces the account's lists with the browser's current ones (after each change). */
export async function saveMyLists(lists: unknown): Promise<ListsResult> {
  return run(async (userId) => {
    const clean = sanitizeLists(lists);
    await writeLists(userId, clean);
    return clean;
  });
}
