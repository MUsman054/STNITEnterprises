import type { Brand } from "@/lib/catalog";

/**
 * A brand's logo, drawn as a mask filled with the brand's own colour (`brand.color`, falling
 * back to `currentColor`). Brands without a logo file get a monogram in their colour.
 * Decorative (aria-hidden): pair it with the brand name in text, or use <BrandLogo>.
 */
export function BrandMark({
  brand,
  className = "size-8",
  align = "center",
}: {
  brand: Brand;
  className?: string;
  align?: "center" | "left";
}) {
  if (!brand.logo) {
    return (
      <span
        aria-hidden="true"
        style={brand.color ? { color: brand.color } : undefined}
        className={`grid shrink-0 place-items-center rounded-lg bg-current/10 font-extrabold tracking-tight ${className}`}
      >
        <span className="text-[0.95rem]">{brand.name.slice(0, 2).toUpperCase()}</span>
      </span>
    );
  }
  const mask = `url(${brand.logo}) ${align === "left" ? "left center" : "center"} / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`}
      style={{ mask, WebkitMask: mask, backgroundColor: brand.color }}
    />
  );
}

/**
 * Logo plus name, in the brand's colours, sized for brand tiles. Wordmark logos stand alone
 * (the name is still read out); symbol logos and monograms get the name beside them.
 */
export function BrandLogo({ brand, className = "", align = "center" }: { brand: Brand; className?: string; align?: "center" | "left" }) {
  if (brand.logo && brand.wordmark) {
    return (
      <span className={`flex items-center ${className}`}>
        <BrandMark brand={brand} align={align} className="h-9 w-32" />
        <span className="sr-only">{brand.name}</span>
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark brand={brand} className="h-8 w-9" />
      <span className="text-[16px] font-bold tracking-tight whitespace-nowrap text-foreground">{brand.name}</span>
    </span>
  );
}
