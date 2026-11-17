import { NextResponse, type NextRequest } from "next/server";
import { HUMAN_COOKIE, isValidHumanCookie, turnstileKeys } from "@/server/human-check";

/**
 * One-time Cloudflare Turnstile check when a visitor opens the site (see src/server/human-check.ts).
 *
 * Page loads without a valid "verified" cookie get a small challenge page at the same URL. When
 * the widget passes, the page submits the token to /api/turnstile, which checks it with Cloudflare,
 * sets the cookie and redirects to the page they opened. Later navigations go straight through.
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

  const { hostname, pathname, search } = request.nextUrl;
  return new NextResponse(challengePage(keys.siteKey, hostname, pathname + search), {
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

const LOGO_SVG = `<svg viewBox="47 335 410 410" width="44" height="44" aria-hidden="true"><path d="M68 437 L252 345 L436 437 L252 529 Z" fill="#6ED653" stroke="#6ED653" stroke-linejoin="round" stroke-width="10"/><path d="M68 540 L110 519 L252 579 L394 519 L436 540 L252 631 Z" fill="#43B02A" stroke="#43B02A" stroke-linejoin="round" stroke-width="10"/><path d="M68 644 L110 623 L252 683 L394 623 L436 644 L252 735 Z" fill="#43B02A" stroke="#43B02A" stroke-linejoin="round" stroke-width="10"/></svg>`;

/**
 * The challenge page. The Turnstile widget stays hidden unless Cloudflare needs the visitor to
 * click (appearance: interaction-only); on success the form posts the token to /api/turnstile,
 * which sets the cookie and redirects straight to `next`.
 */
function challengePage(siteKey: string, hostname: string, next: string): string {
  const host = escapeHtml(hostname.replace(/^www\./, ""));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121417" media="(prefers-color-scheme: dark)">
<title>Just a moment… | STN IT Enterprise</title>
<link rel="preconnect" href="https://challenges.cloudflare.com">
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
  :root {
    color-scheme: light dark;
    --bg: #f3f4f6; --card: #ffffff; --fg: #111418; --muted: #5a6169; --line: #e1e4e8;
    --accent: #43b02a; --track: #e1e4e8; --error: #b91c1c;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0a0b0d; --card: #15181c; --fg: #f3f4f6; --muted: #a3abb4; --line: #262b31;
      --accent: #6ed653; --track: #2a2f36; --error: #fca5a5; }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0; min-height: 100vh; min-height: 100dvh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
    background: var(--bg); color: var(--fg);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%; max-width: 400px; padding: 32px 24px 28px; text-align: center;
    background: var(--card); border: 1px solid var(--line); border-radius: 20px;
    box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 12px 32px -12px rgba(0,0,0,.12);
  }
  .brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 28px; }
  .brand svg { display: block; flex: none; }
  .brand-name { font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
  .ring {
    width: 44px; height: 44px; margin: 0 auto 20px; border-radius: 50%;
    border: 3px solid var(--track); border-top-color: var(--accent);
    animation: spin .9s linear infinite;
  }
  .done .ring { animation: none; border-color: var(--accent); position: relative; }
  .done .ring::after {
    content: ""; position: absolute; left: 13px; top: 7px; width: 10px; height: 18px;
    border: solid var(--accent); border-width: 0 3px 3px 0; transform: rotate(45deg);
  }
  .failed .ring { animation: none; border-color: var(--error); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .ring { animation-duration: 2.4s; } }
  h1 { margin: 0 0 8px; font-size: 20px; font-weight: 650; line-height: 1.3; }
  .sub { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.55; overflow-wrap: anywhere; }
  .failed .sub { color: var(--error); }
  form { margin: 0; }
  .widget { display: flex; justify-content: center; }
  .widget:has(iframe) { margin-top: 20px; }
  .retry {
    display: none; margin: 20px auto 0; padding: 10px 20px; border: 0; border-radius: 999px;
    background: #1f7a1f; color: #fff; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .failed .retry { display: inline-block; }
  .foot { margin: 20px 0 0; color: var(--muted); font-size: 12px; text-align: center; line-height: 1.5; }
  .foot strong { font-weight: 600; color: var(--fg); }
  noscript p { margin: 16px 0 0; color: var(--error); font-size: 14px; }
</style>
</head>
<body>
<main class="card" id="card">
  <div class="brand">${LOGO_SVG}<span class="brand-name">STN IT Enterprise</span></div>
  <div class="ring" aria-hidden="true"></div>
  <h1 id="title">Checking your browser</h1>
  <p class="sub" id="sub" role="status" aria-live="polite">This takes just a moment. You'll be redirected to ${host} shortly.</p>
  <form id="form" method="post" action="/api/turnstile">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <div class="widget">
      <div class="cf-turnstile" data-sitekey="${escapeHtml(siteKey)}" data-theme="auto"
        data-appearance="interaction-only" data-refresh-expired="auto"
        data-callback="stnVerified" data-error-callback="stnFailed" data-unsupported-callback="stnFailed"></div>
    </div>
  </form>
  <button type="button" class="retry" onclick="location.reload()">Try again</button>
  <noscript><p>Please enable JavaScript and cookies to continue.</p></noscript>
</main>
<p class="foot">Protected by <strong>Cloudflare Turnstile</strong></p>
<script>
  var card = document.getElementById("card");
  function stnVerified() {
    card.className = "card done";
    document.getElementById("title").textContent = "Verified";
    document.getElementById("sub").textContent = "Taking you to the site…";
    document.getElementById("form").submit();
  }
  function stnFailed() {
    card.className = "card failed";
    document.getElementById("title").textContent = "Verification failed";
    document.getElementById("sub").textContent = "We couldn't verify your browser. Please try again.";
  }
</script>
</body>
</html>`;
}
