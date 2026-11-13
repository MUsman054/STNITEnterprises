"use client";

import { useSyncExternalStore } from "react";

/**
 * The most recent order, kept in sessionStorage so the confirmation page can show it.
 * DEMO ONLY: nothing is sent to a server and no payment is taken. Replace `saveOrder`
 * with a call to the real order/payment backend when the gateway is connected.
 */

export type PaymentMethodId = "card" | "paypal" | "bank";

export const paymentMethods: { id: PaymentMethodId; label: string; note: string }[] = [
  {
    id: "card",
    label: "Credit or debit card",
    note: "The secure Stripe card form will appear here once the payment gateway is connected.",
  },
  {
    id: "paypal",
    label: "PayPal",
    note: "You will be redirected to PayPal to approve the payment once the gateway is connected.",
  },
  {
    id: "bank",
    label: "Bank transfer",
    note: "Bank details will be included with the order confirmation once payments are set up.",
  },
];

export type Order = {
  number: string;
  placedAt: string;
  email: string;
  name: string;
  addressLines: string[];
  paymentMethod: PaymentMethodId;
  notes: string;
  lines: { slug: string; name: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
};

const STORAGE_KEY = "stn-last-order-v1";
const noopSubscribe = () => () => {};

let cachedRaw: string | null | undefined;
let cachedOrder: Order | null = null;

function read(): Order | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedOrder;
  cachedRaw = raw;
  try {
    cachedOrder = raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    cachedOrder = null;
  }
  return cachedOrder;
}

const HISTORY_KEY = "stn-orders-v1";

export function saveOrder(order: Order) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    // Order history for the "Order History" page (this browser only, until accounts exist).
    const history = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    const next = [order, ...(Array.isArray(history) ? history : [])].slice(0, 50);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Without storage the confirmation page falls back to a generic message.
  }
}

let cachedHistoryRaw: string | null | undefined;
let cachedHistory: Order[] = [];
const EMPTY_HISTORY: Order[] = [];

function readHistory(): Order[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(HISTORY_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedHistoryRaw) return cachedHistory;
  cachedHistoryRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedHistory = Array.isArray(parsed) ? (parsed as Order[]) : EMPTY_HISTORY;
  } catch {
    cachedHistory = EMPTY_HISTORY;
  }
  return cachedHistory;
}

export function useOrderHistory(): Order[] {
  return useSyncExternalStore(noopSubscribe, readHistory, () => EMPTY_HISTORY);
}

export function useLastOrder(): Order | null {
  return useSyncExternalStore(noopSubscribe, read, () => null);
}

export const usStates: [code: string, name: string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"],
  ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"],
  ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];
