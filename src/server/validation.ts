import "server-only";
import { z } from "zod";
import { MAX_QTY } from "@/lib/cart-limits";
import { invitableRoles } from "@/lib/roles";
import { usStates } from "@/lib/order";

/**
 * Server-side input validation. The browser validates too (for quick feedback), but only
 * these checks are trusted: every Server Action parses its input with one of these schemas.
 */

const stateCodes = new Set(usStates.map(([code]) => code));

/** Trimmed text with a hard length cap; strips ASCII control characters except newlines/tabs. */
const text = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max, `Keep this under ${max} characters.`));

const requiredText = (max: number, message: string) => text(max).pipe(z.string().min(1, message));
/** Optional text: missing, empty or whitespace-only all become null. */
const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((value) => (value ? value : null));

export const email = text(254)
  .transform((value) => value.toLowerCase())
  .pipe(z.email("Enter a valid email address, like name@example.com."));

/** Honeypot: a hidden field real people never fill in. */
const honeypot = z.string().max(500).optional();

export const contactSchema = z.object({
  name: requiredText(120, "Enter your name."),
  email,
  message: requiredText(5000, "Tell us a little more.").pipe(z.string().min(10, "Tell us a little more (at least 10 characters).")),
  website: honeypot,
});

const money = text(20)
  .transform((value) => value.replace(/[$,\s]/g, ""))
  .pipe(
    z.union([
      z.literal(""),
      z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a target price as a number."),
    ]),
  )
  .transform((value) => (value ? Math.round(Number(value) * 100) : null));

export const requestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("quote"),
    name: requiredText(120, "Enter your name."),
    email,
    part: requiredText(80, "Enter a part number."),
    quantity: text(7).pipe(z.string().regex(/^\d+$/, "Enter a whole number of 1 or more.")).transform(Number).pipe(z.number().int().min(1).max(1_000_000)),
    targetPrice: money.optional().transform((value) => value ?? null),
    message: optionalText(5000).optional().transform((value) => value ?? null),
    website: honeypot,
  }),
  z.object({
    kind: z.literal("part"),
    name: requiredText(120, "Enter your name."),
    email,
    part: requiredText(80, "Enter a part number."),
    message: optionalText(5000).optional().transform((value) => value ?? null),
    website: honeypot,
  }),
]);

export const newsletterSchema = z.object({ email, website: honeypot });

export const checkoutSchema = z.object({
  email,
  phone: requiredText(30, "Enter a phone number we can reach you on.").refine(
    (value) => value.replace(/\D/g, "").length >= 10,
    "Enter a full phone number, including area code.",
  ),
  firstName: requiredText(80, "Enter your first name."),
  lastName: requiredText(80, "Enter your last name."),
  company: optionalText(120),
  address1: requiredText(200, "Enter your street address."),
  address2: optionalText(200),
  city: requiredText(100, "Enter your city."),
  state: z.string().refine((value) => stateCodes.has(value), "Choose your state."),
  zip: text(10).pipe(z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code, like 33702.")),
  notes: optionalText(2000),
  agree: z.literal(true, "Please accept the terms to place your order."),
  payment: z.enum(["card", "bank"]),
  lines: z
    .array(
      z.object({
        slug: z.string().max(200),
        qty: z.number().int().min(1).max(MAX_QTY),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(100),
});

export const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use 128 characters or fewer.");

export const signupSchema = z.object({
  name: requiredText(120, "Enter your name."),
  company: optionalText(120),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const resetRequestSchema = z.object({ email });

export const resetSchema = z.object({
  token: z.string().min(20).max(100),
  password,
});

// ---------- store admin team ----------

export const inviteSchema = z.object({ email, role: z.enum(invitableRoles, "Choose a role.") });

export const idSchema = z.object({ id: z.uuid() });

export const changeRoleSchema = z.object({ userId: z.uuid(), role: z.enum(invitableRoles) });

const inviteToken = z.string().min(20).max(100);

export const acceptInviteSchema = z.object({ token: inviteToken });

export const acceptInviteSignupSchema = z.object({
  token: inviteToken,
  name: requiredText(120, "Enter your name."),
  password,
});

export const reviewSchema = z.object({
  slug: z.string().max(200),
  rating: z.coerce.number("Choose a star rating.").int("Choose a star rating.").min(1, "Choose a star rating.").max(5, "Choose a star rating."),
  title: optionalText(120),
  body: text(3000).pipe(z.string().min(20, "Tell other buyers a little more (at least 20 characters).")),
});

export const reviewReplySchema = z.object({ id: z.uuid(), reply: optionalText(2000) });

/** Turns a ZodError into { field: firstMessage } for the form UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
