# STN IT Enterprise — storefront

A demo online store for STN IT Enterprise (IT hardware reseller), built with Next.js 16,
Tailwind CSS 4 and TypeScript.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build: `npm run build` then `npm start`.

## What works

- Home, 9 categories with sub-categories, brand pages, deals, product pages
- Part-number search with live suggestions, and a part-request form when nothing matches
- Filters (price range, brand, condition, availability), sorting and "Load more"
- Product pages: zoomable image, specifications and shipping/warranty tabs, Add to Quote, wishlist
- Cart: add, change quantity, remove, save for later (stored in the browser)
- Checkout with a payment-method choice, order confirmation and order history

## What is placeholder

- **Products, prices, ratings and review counts are dummy data** in `src/lib/catalog.ts`.
- **Payments are not connected.** Checkout shows a "payment gateway placeholder" and nothing is charged.
- Accounts, quote/part requests, the newsletter and the contact form are not connected to any service yet.
- Social media links are empty until profile URLs are added in `src/lib/site.ts`.
- Live chat (tawk.to) switches on when `NEXT_PUBLIC_TAWK_PROPERTY_ID` is set in a `.env.local` file.

## Where things are

| Path | Contents |
|------|----------|
| `src/app/` | Pages (one folder per route) |
| `src/components/` | Header, search, product cards, cart, checkout, etc. |
| `src/lib/catalog.ts` | Categories, brands and the dummy product list |
| `src/lib/cart-store.ts` | Cart logic (saved in localStorage) |
| `src/lib/site.ts` | Store name, contact details, social links, menus |
| `src/content/support.ts` | FAQs, return, shipping, warranty, terms and privacy text |
| `src/app/globals.css` | Colours, fonts and animation |
| `design-system/` | Design notes: colours, type, components, rules |
| `public/images/catalog/` | Product photos |
