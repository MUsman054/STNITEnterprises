import { Star } from "lucide-react";

/** Five stars filled to the rating, plus the review count. */
export function Rating({
  value,
  count,
  size = "sm",
  showValue = false,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
}) {
  const star = size === "sm" ? "size-3.5" : "size-[18px]";
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  const stars = (className: string) => (
    <span className="flex">
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} aria-hidden="true" className={`${star} shrink-0 ${className}`} />
      ))}
    </span>
  );

  return (
    <span className={`flex items-center gap-1.5 ${size === "sm" ? "text-[13px]" : "text-sm"}`}>
      {showValue && (
        <span aria-hidden="true" className="font-semibold text-foreground tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
      <span aria-hidden="true" className="relative inline-flex">
        {stars("fill-border text-border")}
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
          {stars("fill-star text-star")}
        </span>
      </span>
      {count !== undefined && (
        <span aria-hidden="true" className="text-muted-foreground tabular-nums">
          {count.toLocaleString("en-US")}
        </span>
      )}
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5
        {count !== undefined ? ` from ${count} ratings` : ""}
      </span>
    </span>
  );
}
