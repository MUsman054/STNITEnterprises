# STN IT Enterprise — storefront

Online store for STN IT Enterprise (IT hardware reseller), built with Next.js 16,
Tailwind CSS 4, TypeScript, PostgreSQL (Drizzle ORM), Stripe and Resend.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer. Nothing else: locally the site uses
PGlite, a full PostgreSQL that runs inside Node and saves to `.data/pglite`.

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run db:migrate              # creates the tables
npm run dev
```

With the local database only one program can open it at a time: stop `npm run dev` before
running `npm run db:migrate` or `npm run make-admin`.

Then open http://localhost:3000. For a production build: `npm run build` then `npm start`.

Card payments locally: install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run
`stripe listen --forward-to localhost:3000/api/stripe/webhook`; put the `whsec_...` it prints in
`STRIPE_WEBHOOK_SECRET`. Use Stripe test cards such as `4242 4242 4242 4242`.

## Going live

1. **Database:** create a hosted PostgreSQL database (e.g. [Neon](https://neon.tech)), set
   `DATABASE_URL=postgres://...`, run `npm run db:migrate`. The local `pglite:` database is
   for development only and is refused on Vercel.
2. **Stripe:** set the live `STRIPE_SECRET_KEY`. Add a webhook endpoint
   `https://<your-domain>/api/stripe/webhook` for the events `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   and `checkout.session.expired`, then set its signing secret as `STRIPE_WEBHOOK_SECRET`.
3. **Email:** verify the domain in [Resend](https://resend.com), set `RESEND_API_KEY`,
   `EMAIL_FROM` and `NOTIFY_EMAIL`.
4. **Bank transfer (optional):** set `BANK_TRANSFER_INSTRUCTIONS`, or leave it empty to hide the option.
5. Set `APP_URL` to the live address (e.g. `https://stnitenterprise.com`) and **redeploy** —
   the checkout page reads which payment methods are configured at build time.
6. **Store owner:** the owner signs up on the site. Then either run
   `npm run make-admin -- owner@example.com` with the production `DATABASE_URL`, or (when the
   database URL is a Secret on Vercel and can't be read) set `BOOTSTRAP_OWNER_EMAIL` on Vercel
   and redeploy: that account becomes owner only if the store has no owner yet. Remove the
   variable afterwards. The admin area is at `/admin`; the owner adds everyone else from
   **Admin → Team** (see below).

On Vercel the project's build command is `npm run db:migrate && npm run build`, so database
migrations are applied on every deploy before the new code goes live. `vercel deploy` reads
`.vercelignore` (not `.gitignore`), which keeps `.data/` and `.env*` from being uploaded.
7. Replace the dummy catalogue in `src/lib/catalog.ts` with real products and prices.

## Store admin team

Staff are invited by email from `/admin/team`. The invitee opens the link (valid once, for
72 hours), creates an account or signs in with the invited email, and joins with the role.
If email isn't set up, the Team page shows the link to send by hand.

| Role | Orders | Inquiries | Subscribers | Team |
|------|--------|-----------|-------------|------|
| Owner | view and update | ✓ | ✓ | invite, re-role and remove admins and sales |
| Admin | view and update | ✓ | ✓ | invite, re-role and remove sales |
| Sales | view only | ✓ | – | – |

Nobody can change their own access, and owners can't be changed from the website (only with
`npm run make-admin -- email [--admin | --sales | --remove]`), so the store can't be locked
out. Removed staff keep their customer account; admin access ends on their next request.
Accounts listed in `ADMIN_EMAILS` (Google sign-in only) are owners.

On self-hosted servers with more than one instance, also set a shared
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (Vercel handles this automatically).

## How the backend works

| What | Where it's stored | Notes |
|------|-------------------|-------|
| Orders and items | `orders`, `order_items` | Priced on the server from the catalogue; the browser only sends product + quantity |
| Card payments | Stripe Checkout | Card details never touch this site. Orders become "Paid" only via the signed webhook |
| Contact, quote and part requests | `inquiries` | Also emailed to `NOTIFY_EMAIL` |
| Newsletter | `newsletter_subscribers` | |
| Customer accounts | `users`, `sessions`, `password_reset_tokens`, `staff_invites` | scrypt password hashes; session and reset tokens stored only as SHA-256 hashes |
| Abuse protection | `rate_limits` | Per-IP / per-email limits on forms, login, signup, reset, checkout |
| Cart and wishlist | Browser localStorage | Product slugs and quantities only, no personal data |

Security measures: server-side validation (zod) on every action, CSRF origin checks
(Next.js Server Actions), HttpOnly/Secure/SameSite session cookies with a `__Host-` prefix,
login rate limits and timing-safe checks, admin role checks in every admin page and action,
HTML escaping in emails, honeypot spam traps, and security headers (CSP, HSTS,
X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) in `next.config.ts`.

## Still placeholder

- **Products, prices, ratings and review counts are dummy data** in `src/lib/catalog.ts`.
- Sales tax is not calculated. Decide with your accountant; Stripe Tax can be added.
- Social media links are empty until profile URLs are added in `src/lib/site.ts`.
- Live chat (tawk.to) switches on when `NEXT_PUBLIC_TAWK_PROPERTY_ID` is set.

## Where things are

| Path | Contents |
|------|----------|
| `src/app/` | Pages (one folder per route); `src/app/admin/` is the store admin |
| `src/app/api/stripe/webhook/` | Stripe webhook |
| `src/actions/` | Server Actions: forms, checkout, accounts, admin |
| `src/server/` | Server-only code: database, auth, orders, email, security, validation |
| `src/server/db/schema.ts` | Database tables; migrations are in `drizzle/` |
| `src/components/` | Header, search, product cards, cart, checkout, etc. |
| `src/lib/catalog.ts` | Categories, brands and the dummy product list |
| `src/lib/cart-store.ts` | Cart logic (saved in localStorage) |
| `src/lib/site.ts` | Store name, contact details, social links, menus |
| `src/content/support.ts` | FAQs, return, shipping, warranty, terms and privacy text |
| `scripts/make-admin.mjs` | Makes an account the store owner (or admin/sales) |
| `.env.example` | Every setting the server needs |
