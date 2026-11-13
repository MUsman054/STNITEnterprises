import { site } from "@/lib/site";

/** Simple brand glyphs (the icon library no longer ships brand logos). */
const icons = {
  facebook: (
    <path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.1L14.1 2C10.9 2 10.2 4.4 10.2 6v2.5H8V12h2.2v10H14V12h2.7l.4-3.5H14Z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.3" />
    </>
  ),
  linkedin: (
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5c0-1.2-.02-2.73-1.66-2.73-1.67 0-1.92 1.3-1.92 2.65V21h-4V9.75Z" />
  ),
  twitter: (
    <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.2 4.7H5.4l11.3 14.5Z" />
  ),
} as const;

const labels: Record<keyof typeof icons, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
};

/** True when at least one social profile URL is set in `site.social`. */
export const hasSocialLinks = Object.values(site.social).some(Boolean);

/**
 * Social profile links from `site.social`. Only profiles with a URL are shown; with none
 * set, nothing renders. Add a URL in src/lib/site.ts and its icon appears automatically.
 */
export function SocialLinks({ className = "" }: { className?: string }) {
  if (!hasSocialLinks) return null;
  return (
    <ul className={`flex items-center gap-2 ${className}`}>
      {(Object.keys(icons) as (keyof typeof icons)[]).filter((key) => site.social[key]).map((key) => {
        const href = site.social[key];
        const glyph = (
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
            {icons[key]}
          </svg>
        );
        const base = "grid size-11 place-items-center rounded-full border transition-colors duration-200";
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${labels[key]} (opens in a new tab)`}
              className={`${base} border-white/20 text-white hover:border-lime hover:bg-lime hover:text-ink`}
            >
              {glyph}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
