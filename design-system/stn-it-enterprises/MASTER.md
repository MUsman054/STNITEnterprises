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

A clean marketplace in the spirit of large retailers, not a copy of any one of them:
charcoal header and footer, a dominant part-number search, category and brand navigation,
white cards on a neutral grey canvas, dense product rows and clear prices. The two logo
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
- Prices: `<Price>` — small "$" and cents, large dollars, `tabular-nums`; screen readers get the plain price.

## Layout

- Content width 1400px; gutters 12px phone, 20px tablet, 24px desktop.
- Header: sticky main bar (logo, ship-to, search with department select, account, cart with
  subtotal). Department row below scrolls away: All menu, Today's deals, 4 departments with
  hover/focus flyouts, Business & bulk orders, Customer service. Phones: full-width search
  under the bar and scrollable department chips.
- Listing pages: 240px filter sidebar (drawer on phones) + 2/3/4-column grid.
- Product page: image (hover zoom) · details · buy box (sticky).

## Components

| Component | File | Notes |
|-----------|------|-------|
| Search with suggestions | `search-box.tsx` | ARIA combobox; popular searches on focus, live product/category suggestions, arrow keys + Enter |
| All menu | `all-menu.tsx` | Left drawer; department sub-panel slides in; focus moves to Back |
| Product card | `product-card.tsx` | Price first, 2-line title, stars, free shipping, "+ Add" → inline stepper |
| Product rail | `product-rail.tsx` | Scroll-snap row with arrow buttons |
| Filters | `product-listing.tsx` | Category, brand, price band, condition, rating, on sale; counts; chips; clear all |
| Cart toast | `cart-toast.tsx` | After card adds; 5s, pauses on hover/focus; no focus steal |
| Cart drawer | `cart-drawer.tsx` | After product-page adds and the header cart button |
| Cart page | `cart-view.tsx` | Quantity, Delete, Save for later, Saved list, Move to cart, suggestions |
| Buy box | `buy-box.tsx` | Add to cart (drawer), Buy now (straight to checkout) |

## Motion

150–700ms, `--ease-out-soft`, all disabled under `prefers-reduced-motion`. Card image zoom
(1.06), hero slide/translate with staggered text, drawer slides, flyout fade, toast drop-in,
cart badge pop, scroll reveal on home sections.

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
