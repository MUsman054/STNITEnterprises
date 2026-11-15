"use client";

import { useSyncExternalStore } from "react";
import { sanitizeWishlist } from "@/lib/shopping-lists";

/**
 * Wishlist: product slugs saved in localStorage, synced across tabs. For signed-in
 * shoppers, AccountSync mirrors it to their account via onWishlistMutation/replaceWishlist.
 */

const STORAGE_KEY = "stn-wishlist-v1";
const EMPTY: string[] = [];
let list: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const mutationListeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const clean = sanitizeWishlist(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"));
    list = clean.length ? clean : EMPTY;
  } catch {
    list = EMPTY;
  }
}

/** fromAccount: data coming from the server, which must not be echoed back to it. */
function commit(next: string[], fromAccount = false) {
  list = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: the wishlist still works for this page view.
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

function get() {
  load();
  return list;
}

export function toggleWishlist(slug: string) {
  const current = get();
  commit(current.includes(slug) ? current.filter((item) => item !== slug) : [slug, ...current]);
}

export function removeFromWishlist(slug: string) {
  commit(get().filter((item) => item !== slug));
}

export function useWishlist(): string[] {
  return useSyncExternalStore(subscribe, get, () => EMPTY);
}

// ---------- account sync hooks ----------

export function getWishlistSnapshot(): string[] {
  return get();
}

export function replaceWishlist(next: unknown) {
  load();
  commit(sanitizeWishlist(next), true);
}

export function onWishlistMutation(listener: () => void) {
  mutationListeners.add(listener);
  return () => {
    mutationListeners.delete(listener);
  };
}
