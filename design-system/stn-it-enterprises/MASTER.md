# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/stn-it-enterprises/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.

---

**Project:** STN IT Enterprise (stnitenterprise.com rebuild)
**Revised:** 2026-11-13 — charcoal header/footer with logo greens; structure from the client spec (STNIT_content.pdf)
**Category:** E-commerce — enterprise IT hardware reseller, ships within the USA
**Stack:** Next.js 16 (App Router) + Tailwind CSS 4 + lucide-react

The tokens below live in `src/app/globals.css` under `@theme` and are the source of truth.

---

## Direction

A B2B hardware store with its own look. It must not resemble Amazon or another big retailer:
no superscript "$ cents" prices, no red "% off" badges, no "List price / You save" wording,
no full-width "+ Add" pills, no three-column image/details/buy-box product page. Instead:
charcoal header and footer, a dominant part-number search, part numbers shown in monospace,
white cards on a neutral grey canvas, plain prices with green savings. No "pill with a dot"
eyebrows or lime pill labels: eyebrows are plain uppercase text. The two logo
greens (#6ED653 light, #43B02A dark) are the accents; #1F7A1F is used for buttons on light
backgrounds because white text on the logo greens fails contrast.

## Color

| Role | Hex | Token | Use |
|------|-----|-------|-----|
| Background | `#FFFFFF` | `background` | Cards, product pages |
| Canvas | `#F3F4F6` | `canvas` | Page background behind cards (home, cart, checkout) |
| Surface | `#F6F7F8` | `surface` | Image wells, table stripes |
| Foreground | `#111418` | `foreground` | Text |
| Muted | `#5A6169` | `muted-foreground` | Secondary text (5.7:1 on canvas) |
| Border | `#E1E4E8` | `border` | Hairlines |
| Nav | `#121417` | `nav` | Charcoal header bar, footer (white text 18.5:1) |
| Nav 2 | `#1D2126` | `nav-2` | Menu row, back-to-top (white 16.2:1) |
| Nav deep | `#0A0B0D` | `nav-deep` | Footer bottom bar |
| Nav muted | `#B9C0C7` | `nav-muted` | Secondary text on charcoal (10:1) |
| Brand | `#43B02A` | `brand` | Logo dark green: search button (dark icon), accents |
| Lime | `#6ED653` | `lime` | Logo light green: badges, highlights and CTAs on charcoal (dark text 10:1) |
| Primary | `#1F7A1F` | `primary` | Buttons and links on light backgrounds (white 5.4:1) |
| Primary soft | `#E9F6E4` | `primary-soft` | Chips, notices, hover fills |
| Hero dark / light | `#15181C` / `#E8F5E2` | `hero-dark` / `hero-light` | Hero and listing banners |
| Sale | `#B91C1C` | `sale` | Discount badge, sale price, errors |
| Star | `#D97706` | `star` | Rating stars (graphic, 3.2:1) |
| Amber text | `#B45309` | `amber-text` | "Only a few left" |

Rules: never white text on `brand`; on light hero use `foreground`/`primary-hover` text, not
`primary` (4.49:1 fails).

## Typography

- **UI and headings:** Inter (`font-sans`, `font-heading`)
- **Display:** Poppins 600–800 (`font-display`) for the wordmark and hero titles only
- Prices: `<Price>` is the plain full price ("$2,899.00", bold, `tabular-nums`). `<PriceStack>` adds
  "was $X" (muted, struck through) and, at large sizes, a green "Save $X (N%)" chip. Prices are never red.
- Part numbers (MPN, SKU) use `font-mono`.

## Layout

- Content width 1400px; gutters 12px phone, 20px tablet, 24px desktop.
- Header: sticky main bar (logo, ship-to, search with department select, account, cart with
  subtotal). Department row below scrolls away: All menu, Today's deals, 4 departments with
  hover/focus flyouts, Business & bulk orders, Customer service. Phones: full-width search
  under the bar and scrollable department chips.
- Listing pages: 240px filter sidebar (drawer on phones) + 2/3/4-column grid.
- Product page: two columns. Image (sticky, hover zoom) | brand/condition/category chips, title,
  MPN/SKU chips, rating, summary, purchase card (price, stock, qty + Add to cart, Buy now,
  Get a quote / Save), key-spec tiles, service strip. Tabs below.

## Components

| Component | File | Notes |
|-----------|------|-------|
| Search with suggestions | `search-box.tsx` | ARIA combobox; popular searches on focus, live product/category suggestions, arrow keys + Enter |
| All menu | `all-menu.tsx` | Phones/tablets. Main panel: 3 shortcuts (Deals, Wishlist, Account), 5 rows, call button. Categories (picture grid), Brands, Support open one sub-panel; focus moves to Back |
| Product card | `product-card.tsx` | Bordered card; Refurb/New chip, dark "−N%" chip with lime text; brand + mono part # line; 2-line title; stock text + single-star rating; price stack; plain outlined "Add to cart" (becomes a stepper) |
| Brand logos | `brand-mark.tsx` | `BrandMark` (mask, takes currentColor) and `BrandLogo` (wordmark alone, symbol + name, or monogram). SVGs in `public/brands` |
| Product rail | `product-rail.tsx` | Scroll-snap row with arrow buttons |
| Filters | `product-listing.tsx` | Category, brand, price band, condition, rating, on sale; counts; chips; clear all |
| Cart toast | `cart-toast.tsx` | After card adds; 5s, pauses on hover/focus; no focus steal |
| Cart drawer | `cart-drawer.tsx` | After product-page adds and the header cart button |
| Cart page | `cart-view.tsx` | Quantity, Delete, Save for later, Saved list, Move to cart, suggestions |
| Buy box | `buy-box.tsx` | Purchase card on the product page: Add to cart (drawer), Buy now (checkout), Get a quote, Save |

## Motion

150–700ms, `--ease-out-soft`, all disabled under `prefers-reduced-motion`. Card image zoom
(1.06), hero product slideshow (crossfade, 6s progress bars that pause on hover/focus/hidden tab, pause button, swipe), drawer slides, flyout fade, toast drop-in,
cart badge pop, scroll reveal on home sections (CSS `animation-timeline: view()`, no JS, so no
hydration mismatches).

## Pre-Delivery Checklist

- [ ] lucide-react icons only; no emoji icons
- [ ] Text contrast 4.5:1 (see table); stars ≥ 3:1 with numeric count beside them
- [ ] Visible focus (green ring; lime on dark green)
- [ ] Touch targets ≥ 44px (verified by automated sweep at 375/768/1024/1440)
- [ ] No horizontal page scroll at any width
- [ ] `prefers-reduced-motion` respected; hero autoplay off for it

## Logo

`src/components/logo.tsx` redraws the client logo (`public/brand/stn-logo-original.jpg`) as SVG:
`LogoLockup` for the header/footer (white letters on charcoal), `LogoMark` for small spaces.
`src/app/icon.svg` is the favicon; `src/app/apple-icon.png` the home-screen icon.
