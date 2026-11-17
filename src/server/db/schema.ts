import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { CartLine } from "@/lib/shopping-lists";

/**
 * Database schema. Money is stored in integer cents to avoid floating-point errors.
 * Secrets that act as credentials (session tokens, reset tokens, order access tokens) are
 * stored only as SHA-256 hashes, so a database leak does not let anyone sign in or open
 * orders.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------- accounts ----------

/**
 * customer: shopper. Staff roles, from least to most access:
 * - sales: views orders and inquiries, marks inquiries handled.
 * - admin: everything in the store admin, and can invite/remove sales staff.
 * - owner: everything, including adding and removing admins. Owners can only be changed
 *   with `npm run make-admin`, never from the website, so the business can't be locked out.
 */
export const userRole = pgEnum("user_role", ["customer", "admin", "sales", "owner"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Always stored lower-cased and trimmed. */
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  company: text("company"),
  /** Null for accounts that only sign in with Google. */
  passwordHash: text("password_hash"),
  /** Google account id ("sub" claim), set when the user signs in with Google. */
  googleId: text("google_id").unique(),
  role: userRole("role").notNull().default("customer"),
  ...timestamps,
});

/**
 * A signed-in shopper's cart, saved-for-later items and wishlist (one row per account), so
 * they follow the account across devices and disappear from the browser on sign-out.
 * Product slugs only: prices always come from the catalogue at checkout.
 */
export const shoppingLists = pgTable("shopping_lists", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  cart: jsonb("cart").$type<CartLine[]>().notNull().default(sql`'[]'::jsonb`),
  saved: jsonb("saved").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  wishlist: jsonb("wishlist").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the cookie token. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    /** SHA-256 of the emailed token. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("password_reset_user_idx").on(table.userId)],
);

/** Invitations to join the store admin team. Accepting one grants `role` to that email's account. */
export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Always stored lower-cased and trimmed. */
    email: text("email").notNull(),
    role: userRole("role").notNull(),
    /** SHA-256 of the emailed token. */
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("staff_invites_email_idx").on(table.email)],
);

// ---------- orders ----------

export const paymentMethod = pgEnum("payment_method", ["card", "bank"]);

export const orderStatus = pgEnum("order_status", [
  "pending_payment",
  "awaiting_bank_transfer",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull().unique(),
    /** SHA-256 of the token in the customer's confirmation link. */
    accessTokenHash: text("access_token_hash").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatus("status").notNull(),
    paymentMethod: paymentMethod("payment_method").notNull(),

    email: text("email").notNull(),
    phone: text("phone").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    company: text("company"),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zip: text("zip").notNull(),
    /** ISO 3166-1 alpha-2 code, e.g. "US". State and ZIP may be empty outside the US. */
    country: text("country").notNull().default("US"),
    notes: text("notes"),

    currency: text("currency").notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull(),
    totalCents: integer("total_cents").notNull(),

    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    ...timestamps,
  },
  (table) => [
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    mpn: text("mpn").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

// ---------- product reviews ----------

/** published: shown on the site. hidden: taken down by staff (kept so the customer can't simply re-post). */
export const reviewStatus = pgEnum("review_status", ["published", "hidden"]);

/**
 * Customer reviews. Only signed-in customers with a paid order containing the product can
 * write one (checked in the Server Action), so every review is a verified purchase.
 * One review per customer per product: writing again updates the existing one.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productSlug: text("product_slug").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The order that proves the purchase. */
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    /** Public name, e.g. "Umar S." (never the email). */
    authorName: text("author_name").notNull(),
    status: reviewStatus("status").notNull().default("published"),
    /** The store's public response, written from the admin panel. */
    replyBody: text("reply_body"),
    replyAt: timestamp("reply_at", { withTimezone: true }),
    replyBy: uuid("reply_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("reviews_product_user_idx").on(table.productSlug, table.userId),
    index("reviews_product_status_idx").on(table.productSlug, table.status),
    index("reviews_created_idx").on(table.createdAt),
    check("reviews_rating_range", sql`${table.rating} between 1 and 5`),
  ],
);

// ---------- inquiries and newsletter ----------

export const inquiryKind = pgEnum("inquiry_kind", ["contact", "quote", "part"]);
export const inquiryStatus = pgEnum("inquiry_status", ["new", "handled"]);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: inquiryKind("kind").notNull(),
    status: inquiryStatus("status").notNull().default("new"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    partNumber: text("part_number"),
    quantity: integer("quantity"),
    targetPriceCents: integer("target_price_cents"),
    message: text("message"),
    ...timestamps,
  },
  (table) => [index("inquiries_status_idx").on(table.status), index("inquiries_created_idx").on(table.createdAt)],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

// ---------- abuse protection ----------

export const rateLimits = pgTable("rate_limits", {
  /** "<action>:<sha256 of ip or email>" — raw IPs and emails are never stored here. */
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().default(sql`now()`),
});

export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type StaffInvite = typeof staffInvites.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type Inquiry = typeof inquiries.$inferSelect;
export type Review = typeof reviews.$inferSelect;
