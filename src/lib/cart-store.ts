"use client";

import { useMemo, useSyncExternalStore } from "react";
import { MAX_QTY } from "@/lib/cart-limits";
import { getProduct, type Product } from "@/lib/catalog";
import { EMPTY_CART, sanitizeCart, type CartLine, type CartState } from "@/lib/shopping-lists";

/**
 * Cart state: items in the cart plus items saved for later.
 *
 * Lives outside React in a small store and is saved to localStorage, so it survives page
 * reloads and stays in sync across browser tabs. For signed-in shoppers, AccountSync
 * (src/components/account-sync.tsx) mirrors it to their account via onCartMutation/replaceCart.
 */

export type { CartLine };
export type CartItem = { product: Product; qty: number; lineTotal: number };


export { MAX_QTY };
const STORAGE_KEY = "stn-cart-v2";
const EMPTY: CartState = EMPTY_CART;

// ---------- tiny store helper ----------

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ---------- cart state ----------

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

const sanitize = sanitizeCart;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    // Older versions kept order details (name, address, email) in the browser. Orders now
    // live on the server, so remove those copies.
    window.localStorage.removeItem("stn-orders-v1");
    window.sessionStorage.removeItem("stn-last-order-v1");
  } catch {
    // Storage unavailable.
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    state = EMPTY;
  }
}

const mutationListeners = new Set<() => void>();

/** fromAccount: data coming from the server, which must not be echoed back to it. */
function commit(next: CartState, fromAccount = false) {
  state = next.lines.length || next.saved.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, blocked site data). The cart still works
    // for this page view; it just won't persist.
  }
  listeners.forEach((listener) => listener());
  if (!fromAccount) mutationListeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getState() {
  load();
  return state;
}

// ---------- account sync hooks ----------

export function getCartSnapshot(): CartState {
  return getState();
}

/** Replaces the cart with the account's copy (sign-in, another device) without re-saving it. */
export function replaceCart(next: unknown) {
  load();
  commit(sanitize(next), true);
}

/** Called after every change the shopper makes in this tab. */
export function onCartMutation(listener: () => void) {
  mutationListeners.add(listener);
  return () => {
    mutationListeners.delete(listener);
  };
}

// ---------- UI state: drawer, toast, screen-reader announcements ----------

const drawerStore = createStore(false);
const announcementStore = createStore("");
export type Toast = { id: number; slug: string; qty: number } | null;
const toastStore = createStore<Toast>(null);
let toastId = 0;

function announce(message: string) {
  // Re-announce identical messages by clearing first.
  announcementStore.set("");
  announcementStore.set(message);
}

export function openCartDrawer() {
  toastStore.set(null);
  drawerStore.set(true);
}

export function closeCartDrawer() {
  drawerStore.set(false);
}

export function dismissToast() {
  toastStore.set(null);
}

// ---------- actions ----------

/**
 * Add a product. `feedback` controls what the shopper sees:
 * "drawer" slides the cart in (product page), "toast" shows a small confirmation
 * (product cards), "none" stays quiet (e.g. Buy now, which goes straight to checkout).
 */
export function addToCart(slug: string, qty = 1, feedback: "drawer" | "toast" | "none" = "toast") {
  const product = getProduct(slug);
  if (!product) return;
  const current = getState();
  const existing = current.lines.find((line) => line.slug === slug);
  const nextQty = Math.min((existing?.qty ?? 0) + Math.max(1, Math.floor(qty)), MAX_QTY);
  commit({
    lines: existing
      ? current.lines.map((line) => (line.slug === slug ? { ...line, qty: nextQty } : line))
      : [...current.lines, { slug, qty: nextQty }],
    saved: current.saved.filter((saved) => saved !== slug),
  });
  announce(`${product.name} added to cart. Quantity ${nextQty}.`);
  if (feedback === "drawer") openCartDrawer();
  if (feedback === "toast") toastStore.set({ id: ++toastId, slug, qty: nextQty });
}

export function setCartQty(slug: string, qty: number) {
  const product = getProduct(slug);
  if (!product) return;
  const next = Math.min(Math.max(1, Math.floor(qty) || 1), MAX_QTY);
  const current = getState();
  commit({ ...current, lines: current.lines.map((line) => (line.slug === slug ? { ...line, qty: next } : line)) });
  announce(`${product.name} quantity set to ${next}.`);
}

export function removeFromCart(slug: string) {
  const product = getProduct(slug);
  const current = getState();
  commit({ ...current, lines: current.lines.filter((line) => line.slug !== slug) });
  if (product) announce(`${product.name} removed from cart.`);
}

export function saveForLater(slug: string) {
  const product = getProduct(slug);
  const current = getState();
  commit({
    lines: current.lines.filter((line) => line.slug !== slug),
    saved: [slug, ...current.saved.filter((saved) => saved !== slug)],
  });
  if (product) announce(`${product.name} saved for later.`);
}

export function moveToCart(slug: string) {
  const product = getProduct(slug);
  const current = getState();
  if (!product) return;
  const existing = current.lines.find((line) => line.slug === slug);
  commit({
    lines: existing ? current.lines : [...current.lines, { slug, qty: 1 }],
    saved: current.saved.filter((saved) => saved !== slug),
  });
  announce(`${product.name} moved to cart.`);
}

export function removeSaved(slug: string) {
  const product = getProduct(slug);
  const current = getState();
  commit({ ...current, saved: current.saved.filter((saved) => saved !== slug) });
  if (product) announce(`${product.name} removed from saved items.`);
}

export function clearCart(options: { silent?: boolean } = {}) {
  const current = getState();
  commit({ lines: [], saved: current.saved });
  if (!options.silent) announce("Cart emptied.");
}

// ---------- hooks ----------

const noopSubscribe = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getState, () => EMPTY);
  const hydrated = useHydrated();

  return useMemo(() => {
    const items: CartItem[] = [];
    for (const line of current.lines) {
      const product = getProduct(line.slug);
      if (product) items.push({ product, qty: line.qty, lineTotal: product.price * line.qty });
    }
    const saved = current.saved.map((slug) => getProduct(slug)).filter((p): p is Product => Boolean(p));
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const savings = items.reduce(
      (sum, item) => sum + (item.product.compareAt ? (item.product.compareAt - item.product.price) * item.qty : 0),
      0,
    );
    const qtyOf = (slug: string) => current.lines.find((line) => line.slug === slug)?.qty ?? 0;
    return { items, saved, count, subtotal, savings, hydrated, qtyOf };
  }, [current, hydrated]);
}

export function useCartDrawerOpen(): boolean {
  return useSyncExternalStore(drawerStore.subscribe, drawerStore.get, () => false);
}

export function useCartAnnouncement(): string {
  return useSyncExternalStore(announcementStore.subscribe, announcementStore.get, () => "");
}

export function useToast(): Toast {
  return useSyncExternalStore(toastStore.subscribe, toastStore.get, () => null);
}
