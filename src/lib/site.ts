/**
 * Store-wide settings. Contact details come from the client's website and content PDFs.
 */
export const site = {
  name: "STN IT Enterprise",
  legalName: "STN IT Enterprise LLC",
  tagline: "Enterprise IT hardware, servers and components",
  description:
    "STN IT Enterprise is a trusted IT hardware reseller supplying servers, server parts, storage drives, memory, networking equipment and accessories to businesses across the USA.",
  url: "https://stnitenterprise.com",
  locale: "en-US",
  currency: "USD",
  copyrightYear: 2026,
  contact: {
    phone: "+1 (727) 334-6180",
    phoneHref: "tel:+17273346180",
    salesEmail: "sales@stnitenterprise.com",
    supportEmail: "stn@stnitenterprise.com",
    addressLines: ["7901 4th St N # 17149", "St. Petersburg, FL 33702"],
    mapQuery: "7901 4th St N, St. Petersburg, FL 33702",
  },
  warehouse: {
    addressLines: ["17440 West Little York Rd, STE A", "Houston, TX 77084"],
    mapQuery: "17440 West Little York Rd, Houston, TX 77084",
  },
  shipping: {
    label: "Standard shipping",
    cost: 0,
    /** From the client's shipping policy (content PDF). */
    estimate: "Ships within 2–5 business days in the US",
    region: "Anywhere in the world",
  },
  /**
   * Social profiles. Leave a value empty until the client provides the URL; empty
   * entries are shown as "coming soon" instead of linking somewhere wrong.
   */
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
  },
} as const;

export const supportNav = [
  { label: "FAQs", href: "/support/faqs" },
  { label: "Return Policy", href: "/support/return-policy" },
  { label: "Warranty", href: "/support/warranty" },
  { label: "Shipping Policy", href: "/support/shipping-policy" },
] as const;

export const legalNav = [
  { label: "Terms & Conditions", href: "/support/terms-conditions" },
  { label: "Privacy Policy", href: "/support/privacy-policy" },
] as const;

export const accountNav = [
  { label: "Login / Signup", href: "/account" },
  { label: "Order History", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
] as const;

const priceFormatter = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
  minimumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

export function mapEmbedUrl(query: string = site.contact.mapQuery): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
}

export function mapDirectionsUrl(query: string = site.contact.mapQuery): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
