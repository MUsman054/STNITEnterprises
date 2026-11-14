"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart-store";

/** Empties the cart once an order has been placed (rendered on the confirmation page). */
export function ClearCartOnMount() {
  useEffect(() => {
    clearCart({ silent: true });
  }, []);
  return null;
}
