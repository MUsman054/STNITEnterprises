/** Shared class strings so buttons and fields look the same everywhere. */

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-[background-color,color,border-color,box-shadow,translate] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

/** Main call to action on light backgrounds (Add to cart, Checkout). */
export const btnPrimary = `${buttonBase} bg-primary text-white hover:bg-primary-hover`;

/** Strong secondary action (Buy now). */
export const btnDark = `${buttonBase} bg-nav text-white hover:bg-nav-2`;

/** Bright brand green with dark text (search, accents on dark green). */
export const btnBrand = `${buttonBase} bg-brand text-ink hover:bg-lime`;

export const btnOutline = `${buttonBase} border border-foreground/25 bg-background text-foreground hover:border-foreground hover:bg-surface`;

export const btnSoft = `${buttonBase} bg-primary-soft text-primary hover:bg-primary hover:text-white`;

export const inputClass =
  "block min-h-12 w-full rounded-lg border border-foreground/25 bg-background px-4 text-base text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 hover:border-foreground/50 focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--color-primary-soft)] aria-[invalid=true]:border-sale";

export const labelClass = "mb-1.5 block text-[15px] font-semibold text-foreground";

export const eyebrowClass = "text-[13px] font-semibold uppercase tracking-[0.12em] text-primary";

/** White card on the grey canvas. */
export const cardClass = "rounded-2xl bg-background p-4 shadow-card sm:p-5";

export const textLink =
  "font-medium text-primary underline-offset-4 hover:text-primary-hover hover:underline";
