import { NextResponse, type NextRequest } from "next/server";
import { HUMAN_COOKIE, createHumanCookie, turnstileKeys, verifyTurnstileToken } from "@/server/human-check";

/** Receives the Turnstile token from the challenge page (src/proxy.ts) and sets the "verified" cookie. */
export async function POST(request: NextRequest) {
  const keys = turnstileKeys();
  if (!keys) return NextResponse.json({ ok: true });

  // Same-origin only: the challenge page posts here with fetch().
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let token: unknown;
  try {
    token = ((await request.json()) as { token?: unknown }).token;
  } catch {
    token = undefined;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const remoteIp = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyTurnstileToken(token, keys.secretKey, remoteIp || undefined))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(HUMAN_COOKIE, createHumanCookie(keys.secretKey), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // No maxAge: a session cookie, so the check runs once per browser session.
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
