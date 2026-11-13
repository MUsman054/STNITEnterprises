import { discountPercent, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "text-base",
  md: "text-[19px]",
  lg: "text-[26px]",
  xl: "text-[34px]",
};

/** Plain, full price ("$2,899.00") in tabular figures. */
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
  return (
    <span className={`inline-block leading-none font-bold tracking-tight tabular-nums ${sizes[size]} ${className}`}>
      {label && <span className="sr-only">{label} </span>}
      {formatPrice(amount)}
    </span>
  );
}

/**
 * Price with the earlier price and saving, when there is one:
 *   $29.00  [Save 17%]
 *   was $35.00
 * Savings use the brand green, not red.
 */
export function PriceStack({ product, size = "md", className = "" }: { product: Product; size?: Size; className?: string }) {
  const discount = discountPercent(product);
  const onSale = discount !== null && product.compareAt !== undefined;
  const large = size === "lg" || size === "xl";

  return (
    <div className={className}>
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <Price amount={product.price} size={size} label={onSale ? "Sale price" : undefined} className="text-foreground" />
        {onSale && large && (
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[13px] font-semibold text-primary">
            Save {formatPrice(product.compareAt! - product.price)} ({discount}%)
          </span>
        )}
      </p>
      {onSale && (
        <p className={`text-muted-foreground tabular-nums ${large ? "mt-2 text-[14px]" : "mt-1 text-[12px]"}`}>
          was <s className="decoration-muted-foreground/60">{formatPrice(product.compareAt!)}</s>
        </p>
      )}
    </div>
  );
}
