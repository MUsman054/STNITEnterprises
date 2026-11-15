"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, use, useId, useState } from "react";
import { ChevronDown, CircleUserRound, Heart, LogOut, Menu, Package, Phone, Shield, ShoppingCart } from "lucide-react";
import { logout } from "@/actions/auth";
import { openCartDrawer, useCart } from "@/lib/cart-store";
import { brands, categories } from "@/lib/catalog";
import { accountNav, formatPrice, site, supportNav } from "@/lib/site";
import { useWishlist } from "@/lib/wishlist-store";
import { AllMenu } from "@/components/all-menu";
import { LogoLockup } from "@/components/logo";
import { ProductImage } from "@/components/product-image";
import { SearchBox } from "@/components/search-box";
import type { HeaderUser } from "@/server/auth";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const rowLink =
  "flex h-11 items-center gap-1 rounded-md px-3 text-[14px] font-medium whitespace-nowrap text-white transition-colors duration-150 hover:bg-white/10";

/**
 * Menu item with a panel that opens on hover, keyboard focus or click, and closes on
 * Escape, blur, mouse-out or selection. `wide` panels span the whole header width.
 */
function MenuDropdown({
  label,
  href,
  active,
  wide = false,
  align = "left",
  content,
  ariaLabel,
  children,
}: {
  label: string;
  /** Custom trigger content (defaults to the label). */
  content?: React.ReactNode;
  ariaLabel?: string;
  href?: string;
  active?: boolean;
  wide?: boolean;
  align?: "left" | "right";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const close = () => setOpen(false);

  const trigger = (
    <>
      {content ?? label}
      <ChevronDown
        aria-hidden="true"
        className={`size-3.5 text-nav-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </>
  );

  return (
    <li
      className={wide ? "static" : "relative"}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      {href ? (
        <Link
          href={href}
          onClick={close}
          aria-label={ariaLabel}
          aria-current={active ? "page" : undefined}
          className={`${rowLink} ${active ? "bg-white/10" : ""}`}
        >
          {trigger}
        </Link>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={`${rowLink} ${active ? "bg-white/10" : ""}`}
        >
          {trigger}
        </button>
      )}
      <div
        id={panelId}
        className={`absolute top-full z-50 pt-1.5 transition-[opacity,translate,visibility] duration-150 ease-out ${
          wide ? "inset-x-0" : align === "right" ? "right-0" : "left-0"
        } ${open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"}`}
      >
        <div className="rounded-2xl border border-border bg-background p-2 text-foreground shadow-pop">{children(close)}</div>
      </div>
    </li>
  );
}

const panelLink =
  "flex min-h-11 items-center rounded-lg px-3 text-[15px] text-foreground transition-colors duration-150 hover:bg-primary-soft hover:text-primary";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-lime font-bold text-ink ${size === "lg" ? "size-11 text-[15px]" : "size-8 text-[13px]"}`}
    >
      {initials(name)}
    </span>
  );
}

function AccountFromPromise({ userPromise, iconButton }: { userPromise: Promise<HeaderUser>; iconButton: string }) {
  return <AccountControls user={use(userPromise)} iconButton={iconButton} />;
}

/** Desktop "Account & Orders" dropdown plus the mobile account icon, for either signed-in state. */
function AccountControls({ user, iconButton }: { user: HeaderUser; iconButton: string }) {
  const firstName = user?.name.split(" ")[0] ?? "";
  const signedInLinks = [
    { href: "/account", label: "My Account", icon: CircleUserRound },
    { href: "/account/orders", label: "Order History", icon: Package },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    ...(user?.isStaff ? [{ href: "/admin", label: "Store admin", icon: Shield }] : []),
  ];

  return (
    <>
      <ul className="hidden lg:block">
        <MenuDropdown
          label="Account"
          href="/account"
          align="right"
          ariaLabel={user ? `Account and orders, signed in as ${user.name}` : "Account and orders"}
          content={
            user ? (
              <span className="flex items-center gap-2.5 text-left leading-tight">
                <Avatar name={user.name} />
                <span>
                  <span className="block max-w-32 truncate text-[12px] font-normal text-nav-muted">Hello, {firstName}</span>
                  <span className="block text-[14px] font-semibold">Account &amp; Orders</span>
                </span>
              </span>
            ) : (
              <span className="text-left leading-tight">
                <span className="block text-[12px] font-normal text-nav-muted">Hello, sign in</span>
                <span className="block text-[14px] font-semibold">Account &amp; Orders</span>
              </span>
            )
          }
        >
          {(close) =>
            user ? (
              <div className="w-72 p-2">
                <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
                  <Avatar name={user.name} size="lg" />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-foreground">{user.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{user.email}</span>
                  </span>
                </div>
                <ul className="mt-2">
                  {signedInLinks.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link href={href} onClick={close} className={`${panelLink} gap-3`}>
                        <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <form action={logout} className="mt-1 border-t border-border pt-1">
                  <button type="submit" className={`${panelLink} w-full gap-3 text-left`}>
                    <LogOut aria-hidden="true" className="size-4 text-muted-foreground" />
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <div className="w-64 p-2">
                <Link href="/account" onClick={close} className="flex min-h-11 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white hover:bg-primary-hover">
                  Sign in
                </Link>
                <p className="mt-2 text-center text-[13px] text-muted-foreground">
                  New customer?{" "}
                  <Link href="/account?mode=signup" onClick={close} className="font-semibold text-primary underline-offset-4 hover:underline">
                    Start here
                  </Link>
                </p>
                <ul className="mt-2">
                  {accountNav.slice(1).map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={close} className={panelLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }
        </MenuDropdown>
      </ul>
      <Link
        href="/account"
        className={`${iconButton} leading-tight lg:hidden`}
        aria-label={user ? `My account, signed in as ${user.name}` : "My account, sign in"}
      >
        {user ? <Avatar name={user.name} /> : <CircleUserRound aria-hidden="true" className="size-6" />}
      </Link>
    </>
  );
}

export function SiteHeader({ userPromise }: { userPromise: Promise<HeaderUser> }) {
  const pathname = usePathname();
  const { count, subtotal, hydrated } = useCart();
  const wishlist = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = hydrated ? count : 0;
  const wishCount = hydrated ? wishlist.length : 0;

  const iconButton =
    "relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-white transition-colors duration-150 hover:bg-white/10";

  return (
    <>
      {/* Main bar (sticky) */}
      <div className="on-dark sticky top-0 z-40 bg-nav text-white shadow-[0_2px_10px_rgb(0_0_0/0.35)]">
        <div className="container-page flex h-16 items-center gap-1.5 lg:h-[76px] lg:gap-5">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-label="Open menu"
            className={`${iconButton} -ml-1 lg:hidden`}
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>

          <Link href="/" aria-label={`${site.name} home`} className="flex min-h-11 shrink-0 items-center rounded-md px-1">
            <LogoLockup className="text-[17px] sm:text-[20px]" />
          </Link>

          <div className="mx-1 hidden flex-1 md:block">
            <SearchBox id="search-desktop" />
          </div>

          <div className="ml-auto flex items-center md:ml-0">
            {/* Account menu: the static shell shows the signed-out state, then the real one streams in. */}
            <Suspense fallback={<AccountControls user={null} iconButton={iconButton} />}>
              <AccountFromPromise userPromise={userPromise} iconButton={iconButton} />
            </Suspense>

            <Link
              href="/wishlist"
              aria-label={`Wishlist, ${wishCount} ${wishCount === 1 ? "item" : "items"}`}
              className={`${iconButton} hidden sm:flex`}
            >
              <Heart aria-hidden="true" className="size-6" />
              {wishCount > 0 && (
                <span key={wishCount} aria-hidden="true" className="animate-pop-in absolute top-0.5 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] font-bold text-ink">
                  {wishCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openCartDrawer}
              aria-haspopup="dialog"
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              className={iconButton}
            >
              <span className="relative">
                <ShoppingCart aria-hidden="true" className="size-7" />
                <span
                  key={cartCount}
                  aria-hidden="true"
                  className={`absolute -top-2 -right-2.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold tabular-nums ${
                    cartCount > 0 ? "animate-pop-in bg-lime text-ink" : "bg-white/15 text-white"
                  }`}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              </span>
              <span className="hidden pl-1.5 text-left leading-tight lg:block" aria-hidden="true">
                <span className="block text-[12px] text-nav-muted">Cart</span>
                <span className="block text-[14px] font-semibold tabular-nums">{formatPrice(hydrated ? subtotal : 0)}</span>
              </span>
            </button>
          </div>
        </div>

        <div className="container-page pb-3 md:hidden">
          <SearchBox id="search-mobile" showDepartments={false} />
        </div>
      </div>

      {/* Menu row (scrolls away) */}
      <nav aria-label="Main" className="on-dark border-t border-white/5 bg-nav-2 text-white">
        <div className="container-page relative flex items-center">
          <ul className="hidden items-center lg:flex">
            <li>
              <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={`${rowLink} ${pathname === "/" ? "bg-white/10" : ""}`}>
                Home
              </Link>
            </li>

            <MenuDropdown label="Shop Categories" href="/shop" active={isActive(pathname, "/category") || isActive(pathname, "/shop")} wide>
              {(close) => (
                <div className="grid grid-cols-3 gap-1 p-2">
                  {categories.map((category) => (
                    <div key={category.slug} className="flex gap-3 rounded-xl p-2 transition-colors duration-150 hover:bg-surface">
                      <ProductImage image={category.image} alt="" sizes="56px" className="size-14 shrink-0 rounded-lg bg-surface" />
                      <div className="min-w-0">
                        <Link href={`/category/${category.slug}`} onClick={close} className="inline-flex min-h-8 items-center text-[15px] font-semibold text-foreground hover:text-primary hover:underline">
                          {category.name}
                        </Link>
                        <ul className="mt-0.5">
                          {category.children.map((child) => (
                            <li key={child.slug}>
                              <Link
                                href={`/category/${category.slug}/${child.slug}`}
                                onClick={close}
                                className="inline-flex min-h-8 items-center text-[14px] text-muted-foreground hover:text-primary hover:underline"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MenuDropdown>

            <MenuDropdown label="Brands" href="/brands" active={isActive(pathname, "/brand") || isActive(pathname, "/brands")}>
              {(close) => (
                <div className="w-[420px] p-1">
                  <ul className="grid grid-cols-2">
                    {brands.map((brand) => (
                      <li key={brand.slug}>
                        <Link href={`/brand/${brand.slug}`} onClick={close} className={panelLink}>
                          {brand.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/brands" onClick={close} className="mt-1 flex min-h-11 items-center justify-center rounded-lg bg-surface text-[14px] font-semibold text-primary hover:bg-primary-soft">
                    All brands
                  </Link>
                </div>
              )}
            </MenuDropdown>

            <li>
              <Link href="/deals" aria-current={isActive(pathname, "/deals") ? "page" : undefined} className={`${rowLink} font-semibold text-lime`}>
                Deals
              </Link>
            </li>
            <li>
              <Link href="/about-us" aria-current={isActive(pathname, "/about-us") ? "page" : undefined} className={`${rowLink} ${isActive(pathname, "/about-us") ? "bg-white/10" : ""}`}>
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact-us" aria-current={isActive(pathname, "/contact-us") ? "page" : undefined} className={`${rowLink} ${isActive(pathname, "/contact-us") ? "bg-white/10" : ""}`}>
                Contact Us
              </Link>
            </li>

            <MenuDropdown label="Support" active={isActive(pathname, "/support")}>
              {(close) => (
                <ul className="w-60">
                  {supportNav.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={close} className={panelLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </MenuDropdown>
          </ul>

          <a
            href={site.contact.phoneHref}
            className="ml-auto hidden h-11 items-center gap-2 rounded-md px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 hover:bg-white/10 xl:flex"
          >
            <Phone aria-hidden="true" className="size-4 text-lime" />
            Sales: {site.contact.phone}
          </a>

          {/* Phone and tablet: scrollable chips */}
          <ul className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 py-2 lg:hidden">
            <li>
              <Link href="/deals" className="flex h-11 items-center rounded-full bg-lime px-4 text-[14px] font-semibold whitespace-nowrap text-ink">
                Deals
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  aria-current={isActive(pathname, `/category/${category.slug}`) ? "page" : undefined}
                  className="flex h-11 items-center rounded-full bg-white/10 px-4 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 hover:bg-white/20 aria-[current=page]:bg-white aria-[current=page]:text-ink"
                >
                  {category.short}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <AllMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
