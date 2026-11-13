"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { brands, categories, getCategory } from "@/lib/catalog";
import { accountNav, site, supportNav } from "@/lib/site";
import { LogoLockup } from "@/components/logo";
import { ProductImage } from "@/components/product-image";

type Panel = { kind: "main" } | { kind: "category"; slug: string } | { kind: "brands" } | { kind: "support" } | { kind: "account" };

/**
 * Slide-in menu (phones and tablets). The main panel lists the top-level menu; categories,
 * brands, support and account open a second panel that slides in. Native <dialog> gives the
 * focus trap and Escape-to-close.
 */
export function AllMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const [panel, setPanel] = useState<Panel>({ kind: "main" });
  const panelKey = panel.kind === "category" ? `category:${panel.slug}` : panel.kind;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const openPanel = (next: Panel) => {
    setPanel(next);
    requestAnimationFrame(() => backRef.current?.focus());
  };
  const back = () => {
    const previous = panelKey;
    setPanel({ kind: "main" });
    requestAnimationFrame(() => triggers.current[previous]?.focus());
  };
  const handleClose = () => {
    onClose();
    setPanel({ kind: "main" });
  };

  const sectionTitle = "px-5 pt-5 pb-2 text-[12px] font-bold tracking-wider text-muted-foreground uppercase";
  const row =
    "flex min-h-12 w-full items-center justify-between gap-3 px-5 text-left text-[15px] text-foreground transition-colors duration-150 hover:bg-surface";

  const subButton = (key: string, label: string, next: Panel) => (
    <button
      ref={(node) => {
        triggers.current[key] = node;
      }}
      type="button"
      onClick={() => openPanel(next)}
      className={row}
    >
      {label}
      <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
    </button>
  );

  const category = panel.kind === "category" ? getCategory(panel.slug) : undefined;
  const subTitle =
    panel.kind === "category" ? category?.name : panel.kind === "brands" ? "Brands" : panel.kind === "support" ? "Support" : panel.kind === "account" ? "My Account" : "";

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      data-side="left"
      aria-label="Menu"
      onClose={handleClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="flex h-full flex-col">
        <div className="on-dark flex items-center justify-between gap-3 bg-nav px-5 py-3 text-white">
          <LogoLockup className="text-[17px]" />
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="Close menu"
            className="-mr-2 grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-white/10"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* Main panel */}
          <nav
            aria-label="Main menu"
            inert={panel.kind !== "main"}
            className={`absolute inset-0 overflow-y-auto overscroll-contain transition-[translate] duration-300 ease-[var(--ease-out-soft)] ${
              panel.kind === "main" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <ul className="pt-2">
              <li>
                <Link href="/" onClick={handleClose} className={row}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/deals" onClick={handleClose} className={`${row} font-semibold text-primary`}>
                  Deals &amp; Special Offers
                </Link>
              </li>
            </ul>

            <p className={sectionTitle}>Shop categories</p>
            <ul>
              {categories.map((item) => (
                <li key={item.slug}>{subButton(`category:${item.slug}`, item.name, { kind: "category", slug: item.slug })}</li>
              ))}
              <li>
                <Link href="/shop" onClick={handleClose} className={`${row} font-semibold`}>
                  All products
                </Link>
              </li>
            </ul>

            <div className="mt-2 border-t border-border pb-6">
              <ul className="pt-2">
                <li>{subButton("brands", "Brands", { kind: "brands" })}</li>
                <li>
                  <Link href="/about-us" onClick={handleClose} className={row}>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" onClick={handleClose} className={row}>
                    Contact Us
                  </Link>
                </li>
                <li>{subButton("support", "Support", { kind: "support" })}</li>
                <li>{subButton("account", "My Account", { kind: "account" })}</li>
              </ul>
              <p className="px-5 pt-4 text-sm text-muted-foreground">
                Sales:{" "}
                <a href={site.contact.phoneHref} className="font-semibold text-primary hover:underline">
                  {site.contact.phone}
                </a>
              </p>
            </div>
          </nav>

          {/* Sub panel */}
          <nav
            aria-label={subTitle || "Submenu"}
            inert={panel.kind === "main"}
            className={`absolute inset-0 overflow-y-auto overscroll-contain bg-background transition-[translate] duration-300 ease-[var(--ease-out-soft)] ${
              panel.kind === "main" ? "translate-x-full" : "translate-x-0"
            }`}
          >
            {panel.kind !== "main" && (
              <>
                <button
                  ref={backRef}
                  type="button"
                  onClick={back}
                  className="flex min-h-14 w-full items-center gap-3 border-b border-border px-5 text-[15px] font-semibold text-foreground transition-colors duration-150 hover:bg-surface"
                >
                  <ArrowLeft aria-hidden="true" className="size-5" />
                  Main menu
                </button>
                <p className={sectionTitle}>{subTitle}</p>

                {category && (
                  <ul>
                    <li>
                      <Link href={`/category/${category.slug}`} onClick={handleClose} className={`${row} py-2 font-semibold`}>
                        <span className="flex items-center gap-3">
                          <ProductImage image={category.image} alt="" sizes="44px" zoom={false} className="size-11 shrink-0 rounded-lg bg-surface" />
                          Shop all {category.short}
                        </span>
                      </Link>
                    </li>
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link href={`/category/${category.slug}/${child.slug}`} onClick={handleClose} className={row}>
                          {child.name}
                          <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {panel.kind === "brands" && (
                  <ul>
                    {brands.map((brand) => (
                      <li key={brand.slug}>
                        <Link href={`/brand/${brand.slug}`} onClick={handleClose} className={row}>
                          {brand.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href="/brands" onClick={handleClose} className={`${row} font-semibold text-primary`}>
                        All brands
                      </Link>
                    </li>
                  </ul>
                )}

                {panel.kind === "support" && (
                  <ul>
                    {supportNav.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} onClick={handleClose} className={row}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {panel.kind === "account" && (
                  <ul>
                    {accountNav.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} onClick={handleClose} className={row}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </dialog>
  );
}
