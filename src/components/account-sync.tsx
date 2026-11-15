"use client";

import { use, useEffect } from "react";
import { getMyLists, mergeGuestLists, saveMyLists } from "@/actions/lists";
import { getCartSnapshot, onCartMutation, replaceCart } from "@/lib/cart-store";
import { EMPTY_CART, type ShoppingLists } from "@/lib/shopping-lists";
import { getWishlistSnapshot, onWishlistMutation, replaceWishlist } from "@/lib/wishlist-store";
import type { HeaderUser } from "@/server/auth";

/**
 * Keeps the browser's cart and wishlist tied to the signed-in account, like big shops do:
 * - Guest: everything stays in this browser only.
 * - Sign in: the guest's items are merged into the account, then the account's lists show.
 * - Signed in: every change is saved to the account; other devices' changes load on focus.
 * - Sign out: the browser copy is cleared (the account keeps it for next time).
 *
 * The browser remembers which account its copy belongs to, so one shopper's items are
 * never merged into, or shown to, another account on a shared computer.
 */

const OWNER_KEY = "stn-lists-owner";
const SAVE_DELAY_MS = 250;
const REFRESH_AFTER_MS = 15_000;

function readOwner(): string | null {
  try {
    return window.localStorage.getItem(OWNER_KEY) || null;
  } catch {
    return null;
  }
}

function writeOwner(owner: string | null) {
  try {
    if (owner) window.localStorage.setItem(OWNER_KEY, owner);
    else window.localStorage.removeItem(OWNER_KEY);
  } catch {
    // Storage unavailable: syncing still works for this page view.
  }
}

function snapshot(): ShoppingLists {
  return { ...getCartSnapshot(), wishlist: getWishlistSnapshot() };
}

export function AccountSync({ userPromise }: { userPromise: Promise<HeaderUser> }) {
  const userId = use(userPromise)?.id ?? null;

  useEffect(() => {
    let owner = readOwner();

    if (!userId) {
      // Signed out (or the session expired): drop the account's copy from this browser.
      if (owner) {
        replaceCart(EMPTY_CART);
        replaceWishlist([]);
        writeOwner(null);
      }
      return;
    }

    let active = true;
    let syncing = true;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let lastLoad = 0;

    const apply = (result: Awaited<ReturnType<typeof getMyLists>>) => {
      if (!active || !result.ok || result.userId !== userId) return;
      replaceCart(result.lists);
      replaceWishlist(result.lists.wishlist);
      writeOwner(userId);
      owner = userId;
      lastLoad = Date.now();
    };

    const save = () => {
      saveTimer = undefined;
      if (owner === userId) void saveMyLists(snapshot());
    };
    let changedWhileSyncing = false;
    const scheduleSave = () => {
      if (syncing) changedWhileSyncing = true;
      if (syncing || owner !== userId) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, SAVE_DELAY_MS);
    };
    const offCart = onCartMutation(scheduleSave);
    const offWishlist = onWishlistMutation(scheduleSave);

    /** Applies the server's lists, keeping anything the shopper added while we waited. */
    const settle = async (result: Awaited<ReturnType<typeof getMyLists>>) => {
      const local = snapshot();
      apply(result);
      if (changedWhileSyncing && active) apply(await mergeGuestLists(local));
      changedWhileSyncing = false;
      syncing = false;
    };

    const refresh = async () => {
      if (syncing || saveTimer || Date.now() - lastLoad < REFRESH_AFTER_MS) return;
      syncing = true;
      await settle(await getMyLists());
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
      else if (saveTimer) {
        // Leaving the tab: save now rather than risk losing the last change.
        clearTimeout(saveTimer);
        save();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    void (async () => {
      if (owner) {
        // Our own copy (refresh it), or another account's leftovers in this browser, which
        // must never be merged into this account: either way, load the account's lists.
        await settle(await getMyLists());
      } else {
        await settle(await mergeGuestLists(snapshot()));
      }
    })();

    return () => {
      active = false;
      clearTimeout(saveTimer);
      offCart();
      offWishlist();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  return null;
}
