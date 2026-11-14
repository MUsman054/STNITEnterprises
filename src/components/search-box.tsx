"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { Award, Check, ChevronDown, LayoutGrid, Search, TrendingUp } from "lucide-react";
import { brandName, categories, childName, getProduct, searchBrands, searchCategories, searchProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";
import { ProductImage } from "@/components/product-image";

const popularSearches = ["ST500NM0011", "Xeon processor", "32GB DDR4", "Catalyst switch", "SAS hard drive"];

type Option =
  | { kind: "search"; key: string; href: string; label: string }
  | { kind: "popular"; key: string; href: string; label: string }
  | { kind: "category"; key: string; href: string; label: string }
  | { kind: "brand"; key: string; href: string; label: string }
  | { kind: "product"; key: string; href: string; slug: string };

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bold the parts of `text` that match the search terms. */
function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.join("|")})`, "ig"));
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

const departmentOptions = [{ slug: "", short: "All categories" }, ...categories.map((c) => ({ slug: c.slug, short: c.short }))];

/**
 * Category picker styled like the header menu dropdowns (Brands, Support).
 * Opens on click or ArrowDown; arrows move, Enter/Space picks, Escape closes.
 */
function DepartmentSelect({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, departmentOptions.findIndex((o) => o.slug === value));
  const label = departmentOptions[selectedIndex].short;

  function openAt(index: number) {
    setOpen(true);
    requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function pick(slug: string) {
    onChange(slug);
    close(true);
  }

  function handleOptionKey(event: React.KeyboardEvent, index: number) {
    const last = departmentOptions.length - 1;
    const move = (to: number) => {
      event.preventDefault();
      optionRefs.current[to]?.focus();
    };
    if (event.key === "ArrowDown") move(index === last ? 0 : index + 1);
    else if (event.key === "ArrowUp") move(index === 0 ? last : index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(last);
    else if (event.key === "Tab") close();
  }

  return (
    <div
      className="relative hidden shrink-0 lg:flex"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <input type="hidden" name="cat" value={value} />
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Search in category: ${label}`}
        onClick={() => (open ? close() : openAt(selectedIndex))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openAt(selectedIndex);
          }
        }}
        className={`flex h-full max-w-[170px] items-center gap-1.5 rounded-l-full border-r border-border pr-3 pl-5 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-none ${
          open ? "bg-primary-soft" : "bg-surface"
        }`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute top-full left-0 z-50 pt-2 transition-[opacity,translate,visibility] duration-150 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
        }`}
      >
        <ul
          id={listId}
          role="listbox"
          aria-label="Search in category"
          className="max-h-[min(70vh,480px)] w-64 overflow-y-auto rounded-2xl border border-border bg-background p-2 text-foreground shadow-pop"
        >
          {departmentOptions.map((option, index) => {
            const selected = option.slug === value;
            return (
              <li key={option.slug || "all"} role="presentation">
                <button
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={open ? 0 : -1}
                  onClick={() => pick(option.slug)}
                  onKeyDown={(event) => handleOptionKey(event, index)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-[15px] transition-colors duration-150 hover:bg-primary-soft hover:text-primary focus-visible:bg-primary-soft focus-visible:text-primary focus-visible:outline-none ${
                    selected ? "font-semibold text-primary" : "text-foreground"
                  }`}
                >
                  <span className="truncate">{option.short}</span>
                  {selected && <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Header search with a department filter and live suggestions (ARIA combobox).
 * Arrow keys move through suggestions, Enter opens one, Escape closes the list.
 */
export function SearchBox({ id, showDepartments = true }: { id: string; showDepartments?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = query.trim();
  const searchHref = (term: string, department = dept) => {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (department) params.set("cat", department);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const options = useMemo<Option[]>(() => {
    if (q.length < 2) {
      return popularSearches.map((term) => ({
        kind: "popular" as const,
        key: `popular-${term}`,
        href: searchHref(term, ""),
        label: term,
      }));
    }
    const list: Option[] = [{ kind: "search", key: "search", href: searchHref(q), label: q }];
    for (const brand of searchBrands(q).slice(0, 1)) {
      list.push({ kind: "brand", key: `brand-${brand.slug}`, href: `/brand/${brand.slug}`, label: brand.name });
    }
    for (const category of searchCategories(q).slice(0, 2)) {
      list.push({ kind: "category", key: `cat-${category.slug}`, href: `/category/${category.slug}`, label: category.name });
    }
    for (const product of searchProducts(q, dept || undefined).slice(0, 6)) {
      list.push({ kind: "product", key: `p-${product.slug}`, href: `/product/${product.slug}`, slug: product.slug });
    }
    return list;
    // searchHref only depends on q and dept, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dept]);

  const productCount = options.filter((option) => option.kind === "product").length;
  const optionId = (index: number) => `${listId}-opt-${index}`;

  function go(href: string) {
    setOpen(false);
    setActive(-1);
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current <= 0 ? options.length - 1 : current - 1));
    } else if (event.key === "Enter" && open && active >= 0 && options[active]) {
      event.preventDefault();
      go(options[active].href);
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (query) {
        setQuery("");
      }
    }
  }

  const rowClass = (index: number) =>
    `flex min-h-11 cursor-pointer items-center gap-3 px-4 py-1.5 text-[15px] text-muted-foreground transition-colors duration-100 ${
      index === active ? "bg-primary-soft" : "hover:bg-surface"
    }`;

  return (
    <div
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <form
        role="search"
        action="/shop"
        onSubmit={(event) => {
          event.preventDefault();
          go(q ? searchHref(q) : dept ? `/category/${dept}` : "/shop");
        }}
        className="flex h-12 w-full rounded-full bg-background ring-2 ring-transparent transition-shadow duration-200 focus-within:ring-brand"
      >
        {showDepartments && <DepartmentSelect id={`${id}-dept`} value={dept} onChange={setDept} />}
        <label htmlFor={id} className="sr-only">
          Search products
        </label>
        <input
          id={id}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Part number, brand or keyword"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          aria-label="Search"
          className="m-0.5 grid w-14 shrink-0 place-items-center rounded-full bg-brand text-ink transition-colors duration-200 hover:bg-lime"
        >
          <Search aria-hidden="true" className="size-5" strokeWidth={2.5} />
        </button>
      </form>

      <div
        className={`absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-background shadow-pop transition-[opacity,translate] duration-150 ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <p className="px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wider text-muted-foreground uppercase">
          {q.length < 2 ? "Popular searches" : "Suggestions"}
        </p>
        <ul id={listId} role="listbox" aria-label="Search suggestions" className="max-h-[min(70vh,520px)] overflow-y-auto pb-2">
          {options.map((option, index) => {
            const common = {
              id: optionId(index),
              role: "option" as const,
              "aria-selected": index === active,
              onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
              onMouseEnter: () => setActive(index),
              onClick: () => go(option.href),
              className: rowClass(index),
            };
            if (option.kind === "product") {
              const result = getProduct(option.slug);
              if (!result) return null;
              return (
                <li key={option.key} {...common}>
                  <ProductImage
                    image={result.image}
                    alt=""
                    sizes="44px"
                    zoom={false}
                    className="size-11 shrink-0 rounded-md bg-surface"
                  />
                  <span className="line-clamp-2 min-w-0 flex-1 leading-snug">
                    <Highlight text={result.name} query={q} />
                    <span className="block text-[12px] text-muted-foreground">
                      Part # <Highlight text={result.mpn} query={q} /> · {brandName(result.brand)} · {childName(result)}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground tabular-nums">
                    {formatPrice(result.price)}
                  </span>
                </li>
              );
            }
            const Icon = option.kind === "category" ? LayoutGrid : option.kind === "brand" ? Award : option.kind === "popular" ? TrendingUp : Search;
            return (
              <li key={option.key} {...common}>
                <Icon aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
                {option.kind === "search" && (
                  <span className="min-w-0 flex-1 truncate">
                    Search for <strong className="font-semibold text-foreground">“{option.label}”</strong>
                    {dept && <span> in {categories.find((c) => c.slug === dept)?.short}</span>}
                  </span>
                )}
                {option.kind === "category" && (
                  <span className="min-w-0 flex-1 truncate">
                    <strong className="font-semibold text-foreground">{option.label}</strong>
                    <span> · category</span>
                  </span>
                )}
                {option.kind === "brand" && (
                  <span className="min-w-0 flex-1 truncate">
                    <strong className="font-semibold text-foreground">{option.label}</strong>
                    <span> · all products</span>
                  </span>
                )}
                {option.kind === "popular" && <span className="min-w-0 flex-1 truncate text-foreground">{option.label}</span>}
              </li>
            );
          })}
        </ul>
        {q.length >= 2 && productCount === 0 && (
          <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            No products match “{q}”.{" "}
            <Link href={searchHref(q)} onClick={() => setOpen(false)} className="font-semibold text-primary hover:underline">
              Request this part
            </Link>{" "}
            and our team will source it.
          </p>
        )}
      </div>
    </div>
  );
}
