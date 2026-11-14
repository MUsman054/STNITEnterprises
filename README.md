# STN IT Enterprise — storefront

Online store for STN IT Enterprise (IT hardware reseller), built with Next.js 16,
Tailwind CSS 4, TypeScript, PostgreSQL (Drizzle ORM), Stripe and Resend.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer and a PostgreSQL database
(a free [Neon](https://neon.tech) database works, or Postgres on your machine).

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run db:migrate              # creates the tables
npm run dev
```

Then open http://localhost:3000. For a production build: `npm run build` then `npm start`.

Card payments locally: install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run
`stripe listen --forward-to localhost:3000/api/stripe/webhook`; put the `whsec_...` it prints in
`STRIPE_WEBHOOK_SECRET`. Use Stripe test cards such as `4242 4242 4242 4242`.

## Going live

1. **Database:** create a production Postgres database, set `DATABASE_URL`, run `npm run db:migrate`.
2. **Stripe:** set the live `STRIPE_SECRET_KEY`. Add a webhook endpoint
   `https://<your-domain>/api/stripe/webhook` for the events `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
   and `checkout.session.expired`, then set its signing secret as `STRIPE_WEBHOOK_SECRET`.
3. **Email:** verify the domain in [Resend](https://resend.com), set `RESEND_API_KEY`,
   `EMAIL_FROM` and `NOTIFY_EMAIL`.
4. **Bank transfer (optional):** set `BANK_TRANSFER_INSTRUCTIONS`, or leave it empty to hide the option.
5. Set `APP_URL` to the live address (e.g. `https://stnitenterprise.com`) and **redeploy** —
   the checkout page reads which payment methods are configured at build time.
6. **Admin:** sign up on the site, then run `npm run make-admin -- you@example.com`
   (with the production `DATABASE_URL`). The admin area is at `/admin`.
7. Replace the dummy catalogue in `src/lib/catalog.ts` with real products and prices.

On self-hosted servers with more than one instance, also set a shared
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (Vercel handles this automatically).

## How the backend works

| What | Where it's stored | Notes |
|------|-------------------|-------|
| Orders and items | `orders`, `order_items` | Priced on the server from the catalogue; the browser only sends product + quantity |
| Card payments | Stripe Checkout | Card details never touch this site. Orders become "Paid" only via the signed webhook |
| Contact, quote and part requests | `inquiries` | Also emailed to `NOTIFY_EMAIL` |
| Newsletter | `newsletter_subscribers` | |
| Customer accounts | `users`, `sessions`, `password_reset_tokens` | scrypt password hashes; session and reset tokens stored only as SHA-256 hashes |
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
| `scripts/make-admin.mjs` | Gives an account admin access |
| `.env.example` | Every setting the server needs |
