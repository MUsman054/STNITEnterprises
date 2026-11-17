/**
 * Order constants shared by the browser and the server. Orders themselves live in the
 * database (src/server/orders.ts); nothing personal is stored in the browser.
 */

export type PaymentMethodId = "card" | "bank";

export const paymentMethods: { id: PaymentMethodId; label: string; note: string }[] = [
  {
    id: "card",
    label: "Credit or debit card",
    note: "You'll pay on Stripe's secure checkout page (cards, Apple Pay, Google Pay). We never see or store your card details.",
  },
  {
    id: "bank",
    label: "Bank transfer",
    note: "We'll email our bank details with your order number. Your order ships once the payment arrives.",
  },
];

export type OrderStatus =
  | "pending_payment"
  | "awaiting_bank_transfer"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  awaiting_bank_transfer: "Awaiting bank transfer",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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
