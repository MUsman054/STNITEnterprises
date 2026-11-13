"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Award, LayoutGrid, Search, TrendingUp } from "lucide-react";
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
        className="flex h-12 w-full overflow-hidden rounded-full bg-background ring-2 ring-transparent transition-shadow duration-200 focus-within:ring-brand"
      >
        {showDepartments && (
          <>
            <label htmlFor={`${id}-dept`} className="sr-only">
              Search in category
            </label>
            <select
              id={`${id}-dept`}
              name="dept"
              value={dept}
              onChange={(event) => setDept(event.target.value)}
              className="hidden max-w-[150px] shrink-0 border-r border-border bg-surface pr-2 pl-4 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-primary-soft focus-visible:outline-none lg:block"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.short}
                </option>
              ))}
            </select>
          </>
        )}
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
