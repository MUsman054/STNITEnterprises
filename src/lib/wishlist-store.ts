"use client";

import { useSyncExternalStore } from "react";
import { getProduct } from "@/lib/catalog";

/** Wishlist: product slugs saved in localStorage, synced across tabs. */

const STORAGE_KEY = "stn-wishlist-v1";
const EMPTY: string[] = [];
let list: string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    list = Array.isArray(raw) ? raw.filter((slug): slug is string => typeof slug === "string" && Boolean(getProduct(slug))) : EMPTY;
  } catch {
    list = EMPTY;
  }
}

function commit(next: string[]) {
  list = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: the wishlist still works for this page view.
  }
  listeners.forEach((listener) => listener());
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
