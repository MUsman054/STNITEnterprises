"use client";

import { useSyncExternalStore } from "react";

/**
 * Real review averages for product cards, fetched once per page load from
 * /api/reviews/stats and shared by every card.
 */
type Stats = Record<string, [average: number, count: number]>;

let stats: Stats | null = null;
let loading = false;
const listeners = new Set<() => void>();

function load() {
  if (loading || stats) return;
  loading = true;
  fetch("/api/reviews/stats")
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}))
    .then((data: Stats) => {
      stats = data;
      listeners.forEach((listener) => listener());
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

/** [average, count] for a product, or null while loading / when it has no reviews. */
export function useReviewStats(slug: string): [number, number] | null {
  return useSyncExternalStore(
    subscribe,
    () => stats?.[slug] ?? null,
    () => null,
  );
}
