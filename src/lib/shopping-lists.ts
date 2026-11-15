import { MAX_QTY } from "@/lib/cart-limits";
import { getProduct } from "@/lib/catalog";

/**
 * Cart, saved-for-later and wishlist data, shared by the browser stores and the server.
 * Everything coming from storage or the network goes through these sanitizers, so unknown
 * products, duplicates and silly quantities are dropped.
 */

export type CartLine = { slug: string; qty: number };
export type CartState = { lines: CartLine[]; saved: string[] };
export type ShoppingLists = CartState & { wishlist: string[] };

export const MAX_LIST_ITEMS = 100;
export const EMPTY_CART: CartState = { lines: [], saved: [] };

export function sanitizeCart(input: unknown): CartState {
  const raw = (input ?? {}) as { lines?: unknown; saved?: unknown };
  const lines: CartLine[] = [];
  if (Array.isArray(raw.lines)) {
    for (const entry of raw.lines) {
      const slug = typeof entry?.slug === "string" ? entry.slug : "";
      const qty = Math.floor(Number(entry?.qty));
      if (!getProduct(slug) || !Number.isFinite(qty) || qty < 1) continue;
      if (lines.some((line) => line.slug === slug)) continue;
      lines.push({ slug, qty: Math.min(qty, MAX_QTY) });
      if (lines.length >= MAX_LIST_ITEMS) break;
    }
  }
  const saved: string[] = [];
  if (Array.isArray(raw.saved)) {
    for (const slug of raw.saved) {
      if (typeof slug !== "string" || !getProduct(slug)) continue;
      if (saved.includes(slug) || lines.some((line) => line.slug === slug)) continue;
      saved.push(slug);
      if (saved.length >= MAX_LIST_ITEMS) break;
    }
  }
  return lines.length || saved.length ? { lines, saved } : EMPTY_CART;
}

export function sanitizeWishlist(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const list: string[] = [];
  for (const slug of input) {
    if (typeof slug !== "string" || !getProduct(slug) || list.includes(slug)) continue;
    list.push(slug);
    if (list.length >= MAX_LIST_ITEMS) break;
  }
  return list;
}

export function sanitizeLists(input: unknown): ShoppingLists {
  const raw = (input ?? {}) as { lines?: unknown; saved?: unknown; wishlist?: unknown };
  return { ...sanitizeCart(raw), wishlist: sanitizeWishlist(raw.wishlist) };
}

/**
 * Folds a guest's lists into the account's, the way big shops do when you sign in:
 * every guest item is kept, and for a product in both carts the larger quantity wins
 * (not the sum, so merging the same guest cart twice can't double it).
 */
export function mergeLists(account: ShoppingLists, guest: ShoppingLists): ShoppingLists {
  const qty = new Map(account.lines.map((line) => [line.slug, line.qty]));
  for (const line of guest.lines) qty.set(line.slug, Math.max(qty.get(line.slug) ?? 0, line.qty));
  const lines = [...qty].map(([slug, q]) => ({ slug, qty: q }));
  return sanitizeLists({
    lines,
    saved: [...guest.saved, ...account.saved],
    wishlist: [...guest.wishlist, ...account.wishlist],
  });
}
