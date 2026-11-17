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

  return new NextResponse(challengePage(keys.siteKey, request.nextUrl.hostname), {
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

function challengePage(siteKey: string, hostname: string): string {
  const host = escapeHtml(hostname.replace(/^www\./, ""));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Just a moment...</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --fg: #1d1f20; --muted: #595f66; --line: #e5e7eb; --accent: #1f7a1f;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #161819; --fg: #e8eaed; --muted: #a0a6ad; --line: #2c3034; --accent: #6ed653; }
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; display: flex; flex-direction: column;
    background: var(--bg); color: var(--fg);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .main { flex: 1; width: 100%; max-width: 60rem; margin: 0 auto; padding: 8rem 1.5rem 2rem; }
  .site { display: flex; align-items: center; gap: .75rem; margin: 0 0 .75rem; }
  .site img { width: 2.5rem; height: 2.5rem; border-radius: .5rem; object-fit: cover; }
  h1 { margin: 0; font-size: 2.25rem; font-weight: 500; line-height: 1.2; word-break: break-word; }
  .main, footer { overflow-wrap: anywhere; }
  .lead { margin: 0 0 2rem; font-size: 1.5rem; font-weight: 500; line-height: 1.35; }
  .widget { min-height: 65px; }
  .note { margin: 2rem 0 0; max-width: 40rem; color: var(--muted); font-size: 1rem; line-height: 1.5; }
  .state { display: none; align-items: center; gap: .75rem; font-size: 1rem; }
  .state.show { display: flex; }
  .state.error { color: #d93025; }
  .spinner {
    width: 1.25rem; height: 1.25rem; border-radius: 50%;
    border: 2px solid var(--line); border-top-color: var(--accent);
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
  footer {
    width: 100%; max-width: 60rem; margin: 0 auto; padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid var(--line); color: var(--muted); font-size: .75rem;
    display: flex; flex-wrap: wrap; justify-content: center; gap: .25rem .75rem; text-align: center;
  }
  footer a { color: inherit; }
  noscript p { color: #d93025; }
  @media (max-width: 720px) {
    .main { padding-top: 4rem; }
    h1 { font-size: 1.5rem; }
    .lead { font-size: 1.125rem; }
  }
</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
<div class="main" role="main">
  <div class="site">
    <img src="/brand/stn-logo-original.jpg" alt="" width="40" height="40">
    <h1>${host}</h1>
  </div>
  <p class="lead" id="lead">Verifying you are human. This may take a few seconds.</p>
  <div class="widget" id="widget">
    <div class="cf-turnstile" data-sitekey="${escapeHtml(siteKey)}" data-theme="auto"
      data-callback="stnVerified" data-error-callback="stnFailed" data-expired-callback="stnExpired"></div>
  </div>
  <div class="state" id="state" role="status" aria-live="polite"><span class="spinner" aria-hidden="true"></span><span id="state-text"></span></div>
  <noscript><p>Enable JavaScript and cookies to continue.</p></noscript>
  <p class="note">${host} needs to review the security of your connection before proceeding.</p>
</div>
<footer>
  <span>Security check by Cloudflare Turnstile</span>
  <span aria-hidden="true">&middot;</span>
  <span>&copy; STN IT Enterprise</span>
</footer>
<script>
  var stateEl = document.getElementById("state");
  var stateText = document.getElementById("state-text");
  var leadEl = document.getElementById("lead");
  function show(text, isError) {
    stateText.textContent = text;
    stateEl.className = "state show" + (isError ? " error" : "");
    stateEl.firstChild.style.display = isError ? "none" : "";
  }
  function stnFailed() { show("Verification failed. Refresh the page to try again.", true); }
  function stnExpired() { show("The check expired. Please complete it again.", true); }
  function stnVerified(token) {
    leadEl.textContent = "Verification successful.";
    show("Waiting for ${host} to respond...", false);
    fetch("/api/turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token: token })
    }).then(function (res) {
      if (!res.ok) throw new Error("rejected");
      window.location.reload();
    }).catch(function () {
      leadEl.textContent = "Verifying you are human. This may take a few seconds.";
      show("We couldn't verify your connection. Please try again.", true);
      if (window.turnstile) window.turnstile.reset();
    });
  }
</script>
</body>
</html>`;
}
