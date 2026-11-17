import { NextResponse, type NextRequest } from "next/server";
import { HUMAN_COOKIE, isValidHumanCookie, turnstileKeys } from "@/server/human-check";

/**
 * One-time Cloudflare Turnstile check when a visitor opens the site (see src/server/human-check.ts).
 *
 * Page loads without a valid "verified" cookie get a small challenge page at the same URL. When
 * the widget passes, the page posts the token to /api/turnstile, which checks it with Cloudflare
 * and sets the cookie, then the page reloads into the real content. Later navigations go straight
 * through.
 *
 * Not gated: API routes (Stripe webhook, Google sign-in callback), Next.js assets, files, search
 * engine and link-preview crawlers (so SEO and shared-link previews keep working), and anything
 * that isn't a top-level page load.
 */

const CRAWLER =
  /googlebot|google-inspectiontool|storebot-google|adsbot-google|mediapartners-google|bingbot|bingpreview|duckduckbot|yandex|baiduspider|applebot|facebookexternalhit|facebookcatalog|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|pinterest|redditbot|skypeuripreview/i;

function isPageLoad(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const h = request.headers;
  // Client-side navigations and prefetches (the visitor already passed on the first page load).
  if (h.has("rsc") || h.has("next-router-prefetch") || h.get("purpose") === "prefetch") return false;
  const dest = h.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return (h.get("accept") ?? "").includes("text/html");
}

export function proxy(request: NextRequest) {
  const keys = turnstileKeys();
  if (!keys || !isPageLoad(request)) return NextResponse.next();
  if (CRAWLER.test(request.headers.get("user-agent") ?? "")) return NextResponse.next();
  if (isValidHumanCookie(request.cookies.get(HUMAN_COOKIE)?.value, keys.secretKey)) return NextResponse.next();

  return new NextResponse(challengePage(keys.siteKey), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export const config = {
  // Everything except API routes, Next.js internals and files with an extension (images, icons, robots.txt...).
  matcher: ["/((?!api/|_next/|_vercel/|.*\\..*).*)"],
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function challengePage(siteKey: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Just a moment… | STN IT Enterprise</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #121417; color: #f3f4f6;
  }
  .card {
    width: 100%; max-width: 420px; text-align: center; padding: 32px 24px;
    background: #1d2126; border: 1px solid #2a2f36; border-radius: 16px;
  }
  .brand { margin: 0 0 4px; font-size: 20px; font-weight: 700; letter-spacing: .2px; }
  .brand span { color: #6ed653; }
  h1 { margin: 16px 0 8px; font-size: 18px; font-weight: 600; }
  p { margin: 0 0 20px; color: #b9c0c7; font-size: 14px; line-height: 1.5; }
  .widget { min-height: 65px; display: flex; justify-content: center; }
  #status { min-height: 20px; margin: 16px 0 0; font-size: 13px; }
  #status.error { color: #fca5a5; }
  noscript p { color: #fca5a5; margin-top: 16px; }
</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
<main class="card">
  <p class="brand">STN <span>IT</span> Enterprise</p>
  <h1>Checking your connection</h1>
  <p>This quick security check keeps bots away from our store. You'll only see it once.</p>
  <div class="widget">
    <div class="cf-turnstile" data-sitekey="${escapeHtml(siteKey)}" data-theme="dark"
      data-callback="stnVerified" data-error-callback="stnFailed" data-expired-callback="stnExpired"></div>
  </div>
  <p id="status" role="status" aria-live="polite"></p>
  <noscript><p>Please enable JavaScript to continue.</p></noscript>
</main>
<script>
  var statusEl = document.getElementById("status");
  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.className = isError ? "error" : "";
  }
  function stnFailed() { setStatus("Verification failed. Please refresh the page to try again.", true); }
  function stnExpired() { setStatus("The check expired. Please complete it again.", true); }
  function stnVerified(token) {
    setStatus("Verified. Loading the site…", false);
    fetch("/api/turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token: token })
    }).then(function (res) {
      if (!res.ok) throw new Error("rejected");
      window.location.reload();
    }).catch(function () {
      setStatus("We couldn't verify you. Please try again.", true);
      if (window.turnstile) window.turnstile.reset();
    });
  }
</script>
</body>
</html>`;
}
