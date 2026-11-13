"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, CircleUserRound, Heart, LayoutGrid, Phone, Tag, X } from "lucide-react";
import { brands, categories } from "@/lib/catalog";
import { site, supportNav } from "@/lib/site";
import { LogoLockup } from "@/components/logo";
import { ProductImage } from "@/components/product-image";

type Panel = "main" | "categories" | "brands" | "support";

const titles: Record<Exclude<Panel, "main">, string> = {
  categories: "Shop by category",
  brands: "Brands",
  support: "Support",
};

/**
 * Slide-in menu (phones and tablets). The main panel is short on purpose: three shortcuts and
 * a handful of rows. Categories, brands and support each open one second-level panel, where
 * categories show as a picture grid. Native <dialog> gives the focus trap and Escape-to-close.
 */
export function AllMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Partial<Record<Panel, HTMLButtonElement | null>>>({});
  const [panel, setPanel] = useState<Panel>("main");

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
    const previous = panel;
    setPanel("main");
    requestAnimationFrame(() => triggers.current[previous]?.focus());
  };
  const handleClose = () => {
    onClose();
    setPanel("main");
  };

  const row =
    "flex min-h-13 w-full items-center justify-between gap-3 px-5 text-left text-[16px] font-medium text-foreground transition-colors duration-150 hover:bg-surface";

  const subButton = (key: Exclude<Panel, "main">, label: string, icon?: React.ReactNode) => (
    <button
      ref={(node) => {
        triggers.current[key] = node;
      }}
      type="button"
      onClick={() => openPanel(key)}
      className={row}
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
    </button>
  );

  const shortcut =
    "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border text-[13px] font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:bg-primary-soft";

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
            inert={panel !== "main"}
            className={`absolute inset-0 flex flex-col overflow-y-auto overscroll-contain transition-[translate] duration-300 ease-[var(--ease-out-soft)] ${
              panel === "main" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <ul className="grid grid-cols-3 gap-2 p-4">
              <li>
                <Link href="/deals" onClick={handleClose} className={shortcut}>
                  <Tag aria-hidden="true" className="size-5 text-primary" />
                  Deals
                </Link>
              </li>
              <li>
                <Link href="/wishlist" onClick={handleClose} className={shortcut}>
                  <Heart aria-hidden="true" className="size-5 text-primary" />
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/account" onClick={handleClose} className={shortcut}>
                  <CircleUserRound aria-hidden="true" className="size-5 text-primary" />
                  Account
                </Link>
              </li>
            </ul>

            <ul className="border-t border-border py-2">
              <li>{subButton("categories", "Shop by category", <LayoutGrid aria-hidden="true" className="size-5 text-primary" />)}</li>
              <li>{subButton("brands", "Brands")}</li>
              <li>
                <Link href="/about-us" onClick={handleClose} className={row}>
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" onClick={handleClose} className={row}>
                  Contact us
                </Link>
              </li>
              <li>{subButton("support", "Support")}</li>
            </ul>

            <div className="mt-auto border-t border-border p-4">
              <a
                href={site.contact.phoneHref}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
              >
                <Phone aria-hidden="true" className="size-4" />
                Call sales {site.contact.phone}
              </a>
            </div>
          </nav>

          {/* Second-level panel */}
          <nav
            aria-label={panel === "main" ? "Submenu" : titles[panel]}
            inert={panel === "main"}
            className={`absolute inset-0 overflow-y-auto overscroll-contain bg-background transition-[translate] duration-300 ease-[var(--ease-out-soft)] ${
              panel === "main" ? "translate-x-full" : "translate-x-0"
            }`}
          >
            {panel !== "main" && (
              <>
                <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-border bg-background px-2">
                  <button
                    ref={backRef}
                    type="button"
                    onClick={back}
                    aria-label="Back to main menu"
                    className="grid size-12 place-items-center rounded-full text-foreground transition-colors duration-150 hover:bg-surface"
                  >
                    <ArrowLeft aria-hidden="true" className="size-5" />
                  </button>
                  <p className="text-[16px] font-bold text-foreground">{titles[panel]}</p>
                </div>

                {panel === "categories" && (
                  <div className="p-4">
                    <ul className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <li key={category.slug}>
                          <Link
                            href={`/category/${category.slug}`}
                            onClick={handleClose}
                            className="flex h-full flex-col items-center gap-2 rounded-xl border border-border p-2.5 text-center text-[14px] leading-tight font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:bg-primary-soft"
                          >
                            <ProductImage image={category.image} alt="" sizes="120px" zoom={false} className="aspect-[2/1] w-full rounded-lg bg-surface" />
                            {category.short}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/shop"
                      onClick={handleClose}
                      className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-primary-hover"
                    >
                      Browse all products
                    </Link>
                  </div>
                )}

                {panel === "brands" && (
                  <div className="p-4">
                    <ul className="grid grid-cols-2 gap-2">
                      {brands.map((brand) => (
                        <li key={brand.slug}>
                          <Link
                            href={`/brand/${brand.slug}`}
                            onClick={handleClose}
                            className="flex min-h-12 items-center gap-2.5 rounded-xl border border-border px-3 text-[14px] font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:bg-primary-soft"
                          >
                            <span className="truncate">{brand.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/brands"
                      onClick={handleClose}
                      className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-border text-[15px] font-semibold text-primary transition-colors duration-150 hover:bg-primary-soft"
                    >
                      All brands
                    </Link>
                  </div>
                )}

                {panel === "support" && (
                  <ul className="py-2">
                    {supportNav.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} onClick={handleClose} className={row}>
                          {item.label}
                          <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
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
