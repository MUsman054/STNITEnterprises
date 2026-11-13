"use client";

import { useState } from "react";
import { ProductRail } from "@/components/product-rail";
import { bestSellers, newArrivals } from "@/lib/catalog";

/** Featured products with a Best selling / New arrivals switch. */
export function FeaturedProducts() {
  const [tab, setTab] = useState<"best" | "new">("best");
  const list = tab === "best" ? bestSellers.slice(0, 12) : newArrivals.slice(0, 12);

  return (
    <div className="reveal">
      <div role="group" aria-label="Featured products" className="mb-3 inline-flex rounded-full bg-background p-1 shadow-card">
        {(
          [
            ["best", "Best selling"],
            ["new", "New arrivals"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-full px-5 text-[15px] font-semibold transition-colors duration-200 ${
              tab === key ? "bg-nav text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <ProductRail
        key={tab}
        title={tab === "best" ? "Best selling" : "New arrivals"}
        subtitle={tab === "best" ? "What businesses order most" : "Recently added to the catalogue"}
        products={list}
        href={`/shop`}
        linkLabel="View all"
      />
    </div>
  );
}
