import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ConfigError } from "@/server/env";
import { RateLimitError } from "@/server/security";

export type ActionFailure = { ok: false; error?: string; fieldErrors?: Record<string, string> };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/**
 * Wraps a Server Action body so internal errors never reach the browser: users get a
 * plain message, the details go to the server log. Next.js control flow (redirect,
 * notFound) passes through untouched.
 */
export async function safeAction<R extends { ok: boolean }>(name: string, run: () => Promise<R>): Promise<R | ActionFailure> {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    if (error instanceof ConfigError) {
      console.error(`[action:${name}] configuration error:`, error.message);
      return { ok: false, error: "This feature is temporarily unavailable. Please email or call us instead." };
    }
    console.error(`[action:${name}] failed:`, error);
    return { ok: false, error: "Something went wrong on our side. Please try again in a moment." };
  }
}
