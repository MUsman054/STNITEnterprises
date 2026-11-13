import { formatPrice } from "@/lib/site";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "text-lg",
  md: "text-[22px]",
  lg: "text-[28px]",
  xl: "text-[34px]",
};

/**
 * Marketplace-style price: small currency sign and cents, large dollars.
 * Screen readers get the plain formatted price instead of the split pieces.
 */
export function Price({
  amount,
  size = "md",
  className = "",
  label,
}: {
  amount: number;
  size?: Size;
  className?: string;
  /** Spoken before the price, e.g. "Sale price". */
  label?: string;
}) {
  const [whole, cents] = amount.toFixed(2).split(".");
  const dollars = Number(whole).toLocaleString("en-US");
  return (
    <span className={`inline-block ${className}`}>
      <span className="sr-only">
        {label ? `${label} ` : ""}
        {formatPrice(amount)}
      </span>
      <span
        aria-hidden="true"
        className={`inline-flex items-start leading-none font-bold tracking-tight tabular-nums ${sizes[size]}`}
      >
        <span className="mt-[0.12em] text-[0.52em]">$</span>
        <span>{dollars}</span>
        <span className="mt-[0.12em] text-[0.52em]">{cents}</span>
      </span>
    </span>
  );
}
