/**
 * STN IT Enterprise logo, redrawn as SVG from the client's logo file
 * (public/brand/stn-logo-original.jpg) so it stays sharp and has a light version for dark
 * backgrounds. Shapes are traced from the 1080×1080 original.
 */

export const LOGO_GREEN_LIGHT = "#6ED653";
export const LOGO_GREEN = "#43B02A";

/** The three stacked layers. Coordinates are in the original logo's space. */
export function LogoMarkPaths() {
  const round = { strokeLinejoin: "round" as const, strokeWidth: 10 };
  return (
    <>
      <path d="M68 437 L252 345 L436 437 L252 529 Z" fill={LOGO_GREEN_LIGHT} stroke={LOGO_GREEN_LIGHT} {...round} />
      <path d="M68 540 L110 519 L252 579 L394 519 L436 540 L252 631 Z" fill={LOGO_GREEN} stroke={LOGO_GREEN} {...round} />
      <path d="M68 644 L110 623 L252 683 L394 623 L436 644 L252 735 Z" fill={LOGO_GREEN} stroke={LOGO_GREEN} {...round} />
    </>
  );
}

/** "STN" letterforms. */
export function LogoLetterPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      {/* S */}
      <path d="M504 438 H633 V470 H504 V503 H601 A32 32 0 0 1 633 535 V568 A32 32 0 0 1 601 600 H472 V568 H601 V535 H504 A32 32 0 0 1 472 503 V470 A32 32 0 0 1 504 438 Z" />
      {/* T */}
      <path d="M649 438 H808 V470 H745 V600 H713 V470 H649 Z" />
      {/* N */}
      <path d="M825 600 V455 A17 17 0 0 1 854 443 L953 543 V438 H985 V583 A17 17 0 0 1 956 595 L858 497 V600 Z" />
    </g>
  );
}

/**
 * Full horizontal logo: mark, "STN" and "IT Enterprise LLC".
 * `tone="dark"` is for charcoal backgrounds (white letters).
 */
export function Logo({
  tone = "light",
  className = "",
  showTagline = true,
}: {
  tone?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
}) {
  const letters = tone === "dark" ? "#FFFFFF" : "#111418";
  const tagline = tone === "dark" ? "#C9CFD5" : "#111418";
  return (
    <svg
      viewBox={showTagline ? "60 335 940 410" : "60 335 940 410"}
      className={className}
      role="img"
      aria-label="STN IT Enterprise LLC"
    >
      <LogoMarkPaths />
      <LogoLetterPaths fill={letters} />
      {showTagline && (
        <text
          x="466"
          y="680"
          fill={tagline}
          textLength="526"
          lengthAdjust="spacing"
          style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif", fontSize: 44, fontWeight: 400 }}
        >
          IT Enterprise LLC
        </text>
      )}
    </svg>
  );
}

/** Just the layered mark (used for small spaces and the favicon). */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="47 335 410 410" className={className} aria-hidden="true">
      <LogoMarkPaths />
    </svg>
  );
}

/**
 * Header/footer lockup: mark + "STN" + "IT ENTERPRISE LLC" set as live text, so the
 * tagline stays legible at small sizes (inside the full logo it would be ~5px tall).
 */
export function LogoLockup({ tone = "dark", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const letters = tone === "dark" ? "#FFFFFF" : "#111418";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-[2.4em] w-auto shrink-0" />
      <span className="inline-flex flex-col justify-center leading-none">
        <svg viewBox="466 432 525 174" className="h-[1.32em] w-auto" aria-hidden="true">
          <LogoLetterPaths fill={letters} />
        </svg>
        {/* Stretched to exactly the width of "STN", as in the original logo. */}
        <svg viewBox="0 0 525 64" className="mt-[0.22em] block h-auto w-0 min-w-full" aria-hidden="true">
          <text
            x="2"
            y="50"
            textLength="521"
            lengthAdjust="spacing"
            fill={tone === "dark" ? "#B9C0C7" : "#111418"}
            style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif", fontSize: 52, fontWeight: 400 }}
          >
            IT Enterprise LLC
          </text>
        </svg>
      </span>
    </span>
  );
}
