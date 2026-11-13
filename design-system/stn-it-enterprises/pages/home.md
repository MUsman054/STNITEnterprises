# Home Page Overrides

> Rules here override `../MASTER.md` for the homepage only.

## Section order (canvas background, white cards)

1. Hero product slideshow (`home/hero.tsx`): one product per slide, picked by part number in
   `SLIDE_MPNS`, in a compact white card on the canvas: text left, large unframed photo right.
   Auto-advances every 6s and keeps running under the mouse; pauses only with the pause button,
   keyboard focus inside it, or a hidden tab (never auto-plays under reduced motion). Trust strip
   below. The page's h1 is visually hidden.
2. Shop by category — 9 round shortcuts
3. Four cards: Keep your servers running (2×2), Office essentials (2×2), Top deal, Need help choosing?
4. Rail: Today's deals
5. Rail: Best sellers in Server Components
6. Trust band (free shipping, quality checked, trusted sourcing, real support)
7. Rail: Top rated in Office & Peripherals
8. Rail: Power supplies
9. Rail: Laptops for work
10. Brands we carry: scrolling logo marquee (grey, darkens on hover; Generic is left out)
11. Newsletter band

## Content notes

- Hero prices and "Up to N% off" are computed from the catalogue, so they stay true when prices change.
- The old site's "50 days return" claim is intentionally absent: the published policy says 48 hours
  and a 15% restocking fee. Resolve with the client first.
