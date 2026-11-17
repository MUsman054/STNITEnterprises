"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "@/components/product-card";
import { brandName, childName, discountPercent, getCategory, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";
import { btnOutline, btnPrimary } from "@/lib/ui";

type SortKey = "featured" | "best-selling" | "price-asc" | "price-desc" | "newest";

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "best-selling": "Best selling",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  newest: "Newest",
};

const PAGE_SIZE = 12;

type Filters = {
  groups: string[];
  brands: string[];
  capacities: string[];
  conditions: string[];
  availability: ("in" | "out")[];
  min: string;
  max: string;
  dealsOnly: boolean;
};

const noFilters: Filters = { groups: [], brands: [], capacities: [], conditions: [], availability: [], min: "", max: "", dealsOnly: false };

/** The product's "Capacity" spec (memory and drives), e.g. "500GB" or "1.2TB". */
function capacityOf(product: Product) {
  return product.specs.find(([label]) => label === "Capacity")?.[1] ?? null;
}

const capacityUnits: Record<string, number> = { MB: 1, GB: 1024, TB: 1024 ** 2 };

/** Capacity in MB, for sorting sizes smallest to largest. */
function capacitySize(text: string) {
  const match = /([\d.]+)\s*(MB|GB|TB)/i.exec(text);
  return match ? Number.parseFloat(match[1]) * capacityUnits[match[2].toUpperCase()] : Number.POSITIVE_INFINITY;
}

const CAPACITY_PREVIEW = 6;

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function parsePrice(text: string) {
  const n = Number.parseFloat(text);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Products are grouped by child category when they all share one top category (e.g. a
 * category page), otherwise by top category (shop, brand and deals pages).
 */
function groupOf(product: Product, byChild: boolean) {
  return byChild ? product.child : product.category;
}

function applyFilters(list: Product[], f: Filters, byChild: boolean, skip?: keyof Filters) {
  const min = parsePrice(f.min);
  const max = parsePrice(f.max);
  return list.filter((p) => {
    const available = p.stock === "out" ? "out" : "in";
    return (
      (skip === "groups" || !f.groups.length || f.groups.includes(groupOf(p, byChild))) &&
      (skip === "brands" || !f.brands.length || f.brands.includes(p.brand)) &&
      (skip === "capacities" || !f.capacities.length || f.capacities.includes(capacityOf(p) ?? "")) &&
      (skip === "conditions" || !f.conditions.length || f.conditions.includes(p.condition)) &&
      (skip === "availability" || !f.availability.length || f.availability.includes(available)) &&
      (skip === "min" || min === null || p.price >= min) &&
      (skip === "max" || max === null || p.price <= max) &&
      (skip === "dealsOnly" || !f.dealsOnly || discountPercent(p) !== null)
    );
  });
}

/** `pinFirst`: on single-category listings, pinned products lead the default sort. */
function sortProducts(list: Product[], sort: SortKey, pinFirst: boolean) {
  const copy = [...list];
  const outLast = (a: Product, b: Product) => Number(a.stock === "out") - Number(b.stock === "out");
  const pinned = (a: Product, b: Product) => (pinFirst ? Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) : 0);
  switch (sort) {
    case "best-selling":
      return copy.sort((a, b) => outLast(a, b) || b.sold - a.sold);
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort((a, b) => b.added.localeCompare(a.added));
    default:
      return copy.sort((a, b) => outLast(a, b) || pinned(a, b) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.sold - a.sold);
  }
}

function countBy(list: Product[], key: (p: Product) => string) {
  const counts = new Map<string, number>();
  for (const p of list) counts.set(key(p), (counts.get(key(p)) ?? 0) + 1);
  return counts;
}

function FilterPanel({
  base,
  filters,
  setFilters,
  byChild,
  showGroups,
  idPrefix,
}: {
  base: Product[];
  filters: Filters;
  setFilters: (next: Filters) => void;
  byChild: boolean;
  showGroups: boolean;
  idPrefix: string;
}) {
  const groupCounts = countBy(applyFilters(base, filters, byChild, "groups"), (p) => groupOf(p, byChild));
  const brandCounts = countBy(applyFilters(base, filters, byChild, "brands"), (p) => p.brand);
  const capacityCounts = countBy(applyFilters(base, filters, byChild, "capacities"), (p) => capacityOf(p) ?? "");
  const allCapacities = [...new Set(base.map(capacityOf).filter((c): c is string => c !== null))].sort((a, b) => capacitySize(a) - capacitySize(b));
  const [showAllCapacities, setShowAllCapacities] = useState(false);
  const capacityList =
    showAllCapacities || allCapacities.length <= CAPACITY_PREVIEW + 1
      ? allCapacities
      : allCapacities.filter((c, i) => i < CAPACITY_PREVIEW || filters.capacities.includes(c));
  const conditionCounts = countBy(applyFilters(base, filters, byChild, "conditions"), (p) => p.condition);
  const availabilityCounts = countBy(applyFilters(base, filters, byChild, "availability"), (p) => (p.stock === "out" ? "out" : "in"));
  const dealCount = applyFilters(base, filters, byChild, "dealsOnly").filter((p) => discountPercent(p) !== null).length;

  const groups = [...new Set(base.map((p) => groupOf(p, byChild)))];
  const groupLabel = (slug: string) => {
    if (byChild) {
      const sample = base.find((p) => p.child === slug);
      return sample ? childName(sample) : slug;
    }
    return getCategory(slug)?.name ?? slug;
  };
  const allBrands = [...new Set(base.map((p) => p.brand))].sort((a, b) => brandName(a).localeCompare(brandName(b)));
  const prices = base.map((p) => p.price);
  const [lo, hi] = [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];

  const legend = "mb-1 text-[15px] font-bold text-foreground";
  const option =
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-[15px] text-foreground transition-colors duration-150 hover:bg-surface";
  const count = "ml-auto text-[13px] text-muted-foreground tabular-nums";
  const box = "size-[18px] shrink-0 accent-primary";
  const muted = (n: number) => (n === 0 ? "text-muted-foreground" : "");

  return (
    <div className="space-y-6">
      {showGroups && groups.length > 1 && (
        <fieldset>
          <legend className={legend}>Category</legend>
          {groups.map((slug) => {
            const n = groupCounts.get(slug) ?? 0;
            return (
              <label key={slug} className={`${option} ${muted(n)}`}>
                <input type="checkbox" className={box} checked={filters.groups.includes(slug)} onChange={() => setFilters({ ...filters, groups: toggle(filters.groups, slug) })} />
                {groupLabel(slug)}
                <span className={count}>{n}</span>
              </label>
            );
          })}
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>Price range</legend>
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Minimum price</span>
            <span className="relative block">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                id={`${idPrefix}-min`}
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={String(lo)}
                value={filters.min}
                onChange={(event) => setFilters({ ...filters, min: event.target.value })}
                className="h-11 w-full rounded-lg border border-foreground/25 bg-background pr-2 pl-6 text-[15px] tabular-nums"
              />
            </span>
          </label>
          <span aria-hidden="true" className="text-muted-foreground">to</span>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Maximum price</span>
            <span className="relative block">
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                id={`${idPrefix}-max`}
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={String(hi)}
                value={filters.max}
                onChange={(event) => setFilters({ ...filters, max: event.target.value })}
                className="h-11 w-full rounded-lg border border-foreground/25 bg-background pr-2 pl-6 text-[15px] tabular-nums"
              />
            </span>
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            ["Under $50", "", "50"],
            ["$50–$250", "50", "250"],
            ["$250–$1,000", "250", "1000"],
            ["$1,000+", "1000", ""],
          ].map(([label, min, max]) => {
            const active = filters.min === min && filters.max === max;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setFilters({ ...filters, min: active ? "" : min, max: active ? "" : max })}
                className={`min-h-11 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 ${
                  active ? "border-primary bg-primary text-white" : "border-border text-foreground hover:border-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {allBrands.length > 1 && (
        <fieldset>
          <legend className={legend}>Brand</legend>
          {allBrands.map((brand) => {
            const n = brandCounts.get(brand) ?? 0;
            return (
              <label key={brand} className={`${option} ${muted(n)}`}>
                <input type="checkbox" className={box} checked={filters.brands.includes(brand)} onChange={() => setFilters({ ...filters, brands: toggle(filters.brands, brand) })} />
                {brandName(brand)}
                <span className={count}>{n}</span>
              </label>
            );
          })}
        </fieldset>
      )}

      {allCapacities.length > 1 && (
        <fieldset>
          <legend className={legend}>Capacity</legend>
          {capacityList.map((capacity) => {
            const n = capacityCounts.get(capacity) ?? 0;
            return (
              <label key={capacity} className={`${option} ${muted(n)}`}>
                <input type="checkbox" className={box} checked={filters.capacities.includes(capacity)} onChange={() => setFilters({ ...filters, capacities: toggle(filters.capacities, capacity) })} />
                {capacity}
                <span className={count}>{n}</span>
              </label>
            );
          })}
          {allCapacities.length > CAPACITY_PREVIEW + 1 && (
            <button
              type="button"
              aria-expanded={showAllCapacities}
              onClick={() => setShowAllCapacities(!showAllCapacities)}
              className="min-h-11 px-1 text-[14px] font-semibold text-primary underline-offset-4 hover:underline"
            >
              {showAllCapacities ? "Show fewer" : `Show all ${allCapacities.length} sizes`}
            </button>
          )}
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>Condition</legend>
        {["New", "Refurbished"].map((condition) => {
          const n = conditionCounts.get(condition) ?? 0;
          return (
            <label key={condition} className={`${option} ${muted(n)}`}>
              <input type="checkbox" className={box} checked={filters.conditions.includes(condition)} onChange={() => setFilters({ ...filters, conditions: toggle(filters.conditions, condition) })} />
              {condition}
              <span className={count}>{n}</span>
            </label>
          );
        })}
      </fieldset>

      <fieldset>
        <legend className={legend}>Availability</legend>
        {(
          [
            ["in", "In stock"],
            ["out", "Out of stock"],
          ] as const
        ).map(([key, label]) => {
          const n = availabilityCounts.get(key) ?? 0;
          return (
            <label key={key} className={`${option} ${muted(n)}`}>
              <input type="checkbox" className={box} checked={filters.availability.includes(key)} onChange={() => setFilters({ ...filters, availability: toggle(filters.availability, key) })} />
              {label}
              <span className={count}>{n}</span>
            </label>
          );
        })}
      </fieldset>

      <fieldset>
        <legend className={legend}>Offers</legend>
        <label className={option}>
          <input type="checkbox" className={box} checked={filters.dealsOnly} onChange={() => setFilters({ ...filters, dealsOnly: !filters.dealsOnly })} />
          On sale
          <span className={count}>{dealCount}</span>
        </label>
      </fieldset>
    </div>
  );
}

/**
 * Product results with a filter sidebar (drawer on phones), sorting, removable filter
 * chips and "Load more". Filtering is instant and happens in the browser.
 */
export function ProductListing({
  products,
  showGroups = true,
  query,
  emptyState,
  initialSort = "featured",
}: {
  products: Product[];
  showGroups?: boolean;
  query?: string;
  emptyState?: React.ReactNode;
  initialSort?: SortKey;
}) {
  const [filters, setFiltersState] = useState<Filters>(noFilters);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const byChild = new Set(products.map((p) => p.category)).size === 1;

  const setFilters = (next: Filters) => {
    setFiltersState(next);
    setVisible(PAGE_SIZE);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  const results = useMemo(() => sortProducts(applyFilters(products, filters, byChild), sort, byChild), [products, filters, sort, byChild]);
  const shown = results.slice(0, visible);

  const groupLabel = (slug: string) => {
    if (byChild) {
      const sample = products.find((p) => p.child === slug);
      return sample ? childName(sample) : slug;
    }
    return getCategory(slug)?.name ?? slug;
  };
  const minLabel = parsePrice(filters.min);
  const maxLabel = parsePrice(filters.max);
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...filters.groups.map((slug) => ({ key: `g-${slug}`, label: groupLabel(slug), clear: () => setFilters({ ...filters, groups: filters.groups.filter((g) => g !== slug) }) })),
    ...(minLabel !== null || maxLabel !== null
      ? [{
          key: "price",
          label: minLabel !== null && maxLabel !== null ? `${formatPrice(minLabel)}–${formatPrice(maxLabel)}` : minLabel !== null ? `From ${formatPrice(minLabel)}` : `Up to ${formatPrice(maxLabel ?? 0)}`,
          clear: () => setFilters({ ...filters, min: "", max: "" }),
        }]
      : []),
    ...filters.brands.map((brand) => ({ key: `b-${brand}`, label: brandName(brand), clear: () => setFilters({ ...filters, brands: filters.brands.filter((b) => b !== brand) }) })),
    ...filters.capacities.map((cap) => ({ key: `cap-${cap}`, label: cap, clear: () => setFilters({ ...filters, capacities: filters.capacities.filter((x) => x !== cap) }) })),
    ...filters.conditions.map((c) => ({ key: `c-${c}`, label: c, clear: () => setFilters({ ...filters, conditions: filters.conditions.filter((x) => x !== c) }) })),
    ...filters.availability.map((a) => ({ key: `a-${a}`, label: a === "in" ? "In stock" : "Out of stock", clear: () => setFilters({ ...filters, availability: filters.availability.filter((x) => x !== a) }) })),
    ...(filters.dealsOnly ? [{ key: "deals", label: "On sale", clear: () => setFilters({ ...filters, dealsOnly: false }) }] : []),
  ];

  if (products.length === 0) return <>{emptyState}</>;

  const panel = (prefix: string) => (
    <FilterPanel base={products} filters={filters} setFilters={setFilters} byChild={byChild} showGroups={showGroups} idPrefix={prefix} />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr] xl:gap-8">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-6">{panel("side")}</div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-[15px] text-muted-foreground">
            <span className="font-semibold text-foreground">{results.length}</span> {results.length === 1 ? "result" : "results"}
            {query ? (
              <>
                {" "}
                for <span className="font-semibold text-foreground">“{query}”</span>
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-haspopup="dialog"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/25 px-4 text-[14px] font-semibold text-foreground transition-colors duration-150 hover:bg-surface lg:hidden"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filters
              {chips.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{chips.length}</span>}
            </button>
            <label className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <span className="hidden sm:inline">Sort by</span>
              <span className="sr-only sm:hidden">Sort by</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortKey);
                  setVisible(PAGE_SIZE);
                }}
                className="h-11 rounded-full border border-foreground/25 bg-background pr-8 pl-4 text-[14px] font-medium text-foreground transition-colors duration-150 hover:border-foreground"
              >
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {chips.length > 0 && (
          <ul aria-label="Active filters" className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <li key={chip.key} className="animate-fade-in">
                <button
                  type="button"
                  onClick={chip.clear}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 text-[14px] font-medium text-primary transition-colors duration-150 hover:bg-primary hover:text-white"
                >
                  {chip.label}
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => setFilters(noFilters)} className="min-h-11 px-2 text-[14px] font-semibold text-foreground underline-offset-4 hover:underline">
                Clear all
              </button>
            </li>
          </ul>
        )}

        <div className="mt-4">
          {results.length > 0 ? (
            <>
              <ProductGrid products={shown} priorityCount={4} />
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-[14px] text-muted-foreground">
                  Showing {shown.length} of {results.length}
                </p>
                <div className="h-1 w-48 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(shown.length / results.length) * 100}%` }} />
                </div>
                {shown.length < results.length && (
                  <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className={`${btnOutline} mt-1`}>
                    Load more
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-surface px-6 py-14 text-center">
              <p className="text-xl font-bold text-foreground">No products match these filters</p>
              <p className="mt-1 text-muted-foreground">Remove a filter to see more results.</p>
              <button type="button" onClick={() => setFilters(noFilters)} className={`${btnPrimary} mt-5`}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="drawer"
        data-side="left"
        aria-labelledby="filters-title"
        onClose={() => setDrawerOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDrawerOpen(false);
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-2">
            <h2 id="filters-title" className="text-lg font-bold text-foreground">
              Filters
            </h2>
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="-mr-2 grid size-11 place-items-center rounded-full transition-colors duration-150 hover:bg-surface">
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{panel("drawer")}</div>
          <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
            <button type="button" onClick={() => setFilters(noFilters)} className="min-h-12 rounded-full border border-foreground/25 text-[15px] font-semibold text-foreground transition-colors duration-150 hover:bg-surface">
              Clear all
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className={btnPrimary}>
              Show {results.length} {results.length === 1 ? "result" : "results"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
