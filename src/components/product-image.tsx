import Image from "next/image";
import type { ProductImage as ProductImageData } from "@/lib/catalog";

type Props = {
  image: ProductImageData;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Extra classes for the well (size, radius, background). */
  className?: string;
  /** Zoom when the nearest `.group` ancestor is hovered. */
  zoom?: boolean;
};

/**
 * Square product photo. The catalogue images have pure white backgrounds; on a tinted
 * well they are multiplied in, so the photo's edges never show.
 */
export function ProductImage({ image, alt, sizes, priority, className = "", zoom = true }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain mix-blend-multiply ${
          zoom
            ? "transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
            : ""
        }`}
      />
    </div>
  );
}
