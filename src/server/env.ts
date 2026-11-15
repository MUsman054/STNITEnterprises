import "server-only";
import { site } from "@/lib/site";

/**
 * Server-side configuration. Values come from environment variables (.env.local in
 * development, the hosting dashboard in production) and are never sent to the browser.
 * See .env.example for the full list.
 */

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export class ConfigError extends Error {}

export function requireEnv(name: string): string {
  const value = read(name);
  if (!value) throw new ConfigError(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

export const isProduction = process.env.NODE_ENV === "production";

/** Public base URL, used for links in emails and Stripe redirects. Never taken from the request Host header. */
export function appUrl(): string {
  const url = read("APP_URL") ?? (isProduction ? site.url : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

export const config = {
  stripeEnabled: () => Boolean(read("STRIPE_SECRET_KEY") && read("STRIPE_WEBHOOK_SECRET")),
  bankTransferInstructions: () => read("BANK_TRANSFER_INSTRUCTIONS")?.replace(/\\n/g, "\n"),
  emailEnabled: () => Boolean(read("RESEND_API_KEY") && read("EMAIL_FROM")),
  googleEnabled: () => Boolean(read("GOOGLE_CLIENT_ID") && read("GOOGLE_CLIENT_SECRET")),
  /** Comma-separated emails that always get admin access (no database edit needed). */
  adminEmails: () =>
    new Set(
      (read("ADMIN_EMAILS") ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  /** Where order and form notifications go. */
  notifyEmail: () => read("NOTIFY_EMAIL") ?? site.contact.salesEmail,
};
