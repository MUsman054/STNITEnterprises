import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection, type NextRequest } from "next/server";
import { safeNextPath } from "@/server/auth";
import { config, isProduction } from "@/server/env";
import { GOOGLE_FLOW_COOKIE, startGoogleFlow } from "@/server/google";

/** Step 1 of "Continue with Google": send the visitor to Google's account chooser. */
export async function GET(request: NextRequest) {
  // Must run per request: with Cache Components a GET handler that reads nothing from the
  // request would be prerendered at build time, freezing the env check and the random state.
  await connection();
  if (!config.googleEnabled()) redirect("/account?error=google_unavailable");

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const { url, flow } = startGoogleFlow(next);

  (await cookies()).set(GOOGLE_FLOW_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    secure: isProduction,
    // Lax so the cookie comes back on Google's top-level redirect to our callback.
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 10 * 60,
  });
  redirect(url);
}
