"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/catalog";

/**
 * Product photo that magnifies under the pointer on hover (mouse only). Touch and
 * keyboard users see the normal image; nothing depends on the zoom.
 */
export function ZoomImage({ image, alt }: { image: ProductImage; alt: string }) {
  const [origin, setOrigin] = useState<string | null>(null);

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-2xl bg-surface md:cursor-zoom-in"
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
      }}
      onPointerLeave={() => setOrigin(null)}
    >
      <Image
        src={image.src}
        alt={alt}
        fill
        priority
        sizes="(min-width: 1024px) 520px, 100vw"
        style={{ transformOrigin: origin ?? "50% 50%" }}
        className={`object-contain p-4 mix-blend-multiply transition-transform duration-300 ease-out ${
          origin ? "scale-[1.9]" : "scale-100"
        }`}
      />
      <p
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-card transition-opacity duration-200 md:block ${
          origin ? "opacity-0" : "opacity-100"
        }`}
      >
        Hover to zoom
      </p>
    </div>
  );
}
