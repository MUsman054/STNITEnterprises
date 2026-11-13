"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Heart, Info, Package, ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart-store";
import { brandName, getProduct, type Product } from "@/lib/catalog";
import { paymentMethods, useOrderHistory } from "@/lib/order";
import { formatPrice } from "@/lib/site";
import { removeFromWishlist, useWishlist } from "@/lib/wishlist-store";
import { useHydrated } from "@/lib/cart-store";
import { btnOutline, btnPrimary, cardClass, inputClass, labelClass } from "@/lib/ui";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login / Signup. Customer accounts need a backend (authentication + database), which is
 * not built yet: the forms validate, then explain that accounts are coming. Wire them to
 * the auth provider chosen for the backend.
 */
export function AuthView() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const base = useId();
  const [values, setValues] = useState({ name: "", email: "", password: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (tab === "signup" && !values.name.trim()) found.name = "Enter your name.";
    if (!values.email.trim()) found.email = "Enter your email address.";
    else if (!emailPattern.test(values.email.trim())) found.email = "Enter a valid email address.";
    if (!values.password) found.password = "Enter your password.";
    else if (tab === "signup" && values.password.length < 8) found.password = "Use at least 8 characters.";
    setErrors(found);
    const first = ["name", "email", "password"].find((key) => found[key]);
    if (first) {
      document.getElementById(`${base}-${first}`)?.focus();
      return;
    }
    setSubmitted(true);
  }

  const field = (name: keyof typeof values, label: string, type: string, autoComplete: string, optional = false) => (
    <div>
      <label htmlFor={`${base}-${name}`} className={labelClass}>
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input
        id={`${base}-${name}`}
        type={type}
        autoComplete={autoComplete}
        value={values[name]}
        onChange={(event) => {
          setValues((current) => ({ ...current, [name]: event.target.value }));
          if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
        }}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${base}-${name}-error` : undefined}
        className={inputClass}
      />
      {errors[name] && (
        <p id={`${base}-${name}-error`} className="mt-1.5 text-sm font-medium text-sale">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto mt-2 grid max-w-4xl gap-5 md:grid-cols-[1fr_300px]">
      <section className={`${cardClass} sm:p-8`} aria-labelledby={`${base}-title`}>
        <h1 id={`${base}-title`} className="text-[26px] font-bold text-foreground">
          {tab === "login" ? "Sign in to your account" : "Create your account"}
        </h1>
        <div role="tablist" aria-label="Account" className="mt-5 grid grid-cols-2 rounded-full bg-surface p-1">
          {(["login", "signup"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setErrors({});
                setSubmitted(false);
              }}
              className={`min-h-11 rounded-full text-[15px] font-semibold transition-colors duration-200 ${tab === key ? "bg-background text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}
            >
              {key === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        {submitted ? (
          <div role="status" className="animate-fade-up mt-6 flex items-start gap-3 rounded-2xl bg-primary-soft p-5 text-[15px] text-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <strong className="font-semibold">Customer accounts are coming soon.</strong> They&apos;ll be switched on with the store&apos;s
              backend. Until then you can check out as a guest, and your orders and wishlist are saved on this device.
            </span>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
            {tab === "signup" && field("name", "Full name", "text", "name")}
            {tab === "signup" && field("company", "Company", "text", "organization", true)}
            {field("email", "Email address", "email", "email")}
            {field("password", "Password", "password", tab === "login" ? "current-password" : "new-password")}
            <button type="submit" className={`${btnPrimary} min-h-12 w-full`}>
              {tab === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}
      </section>

      <aside className={`${cardClass} self-start`} aria-label="Account shortcuts">
        <h2 className="text-lg font-bold text-foreground">Your shortcuts</h2>
        <ul className="mt-3 space-y-1">
          {[
            { href: "/account/orders", label: "Order History", icon: Package },
            { href: "/wishlist", label: "Wishlist", icon: Heart },
            { href: "/cart", label: "Cart", icon: ShoppingCart },
          ].map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-foreground transition-colors duration-150 hover:bg-surface">
                <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export function WishlistView() {
  const hydrated = useHydrated();
  const slugs = useWishlist();
  const items = slugs.map((slug) => getProduct(slug)).filter((p): p is Product => Boolean(p));

  return (
    <section className={`${cardClass} mt-2`} aria-labelledby="wishlist-title">
      <h1 id="wishlist-title" className="border-b border-border pb-3 text-[26px] font-bold text-foreground">
        Wishlist {hydrated && items.length > 0 && <span className="text-lg font-normal text-muted-foreground">({items.length})</span>}
      </h1>
      {!hydrated ? (
        <div aria-busy="true" className="mt-4 h-52 animate-pulse rounded-xl bg-surface" />
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
            <Heart aria-hidden="true" className="size-7" />
          </span>
          <p className="mt-4 text-xl font-bold text-foreground">Your wishlist is empty</p>
          <p className="mt-1 text-muted-foreground">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className={`${btnPrimary} mt-5`}>
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((product) => (
            <li key={product.slug} className="group animate-fade-in flex flex-col rounded-xl border border-border p-3">
              <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden="true">
                <ProductImage image={product.image} alt="" sizes="200px" className="aspect-square rounded-lg bg-surface" />
              </Link>
              <Link href={`/product/${product.slug}`} className="mt-2 line-clamp-2 py-1 text-[14px] leading-snug text-foreground hover:text-primary hover:underline">
                {product.name}
              </Link>
              <p className="text-[12px] text-muted-foreground">
                {brandName(product.brand)} · {product.mpn}
              </p>
              <Price amount={product.price} size="sm" className="mt-1" />
              <div className="mt-auto grid gap-1 pt-3">
                {product.stock === "out" ? (
                  <Link href={`/product/${product.slug}#quote`} className={`${btnOutline} min-h-11 text-[14px]`}>
                    Request a quote
                  </Link>
                ) : (
                  <button type="button" onClick={() => addToCart(product.slug, 1, "toast")} aria-label={`Add ${product.name} to cart`} className={`${btnPrimary} min-h-11 text-[14px]`}>
                    Add to cart
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.slug)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="min-h-11 text-[14px] font-medium text-primary underline-offset-4 hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function OrderHistoryView() {
  const hydrated = useHydrated();
  const orders = useOrderHistory();

  return (
    <section className={`${cardClass} mt-2`} aria-labelledby="orders-title">
      <h1 id="orders-title" className="border-b border-border pb-3 text-[26px] font-bold text-foreground">
        Order History
      </h1>
      <p className="mt-3 flex items-start gap-2 text-[14px] text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Orders placed on this device are listed here. Once customer accounts are switched on, your full history will follow you.
      </p>
      {!hydrated ? (
        <div aria-busy="true" className="mt-4 h-40 animate-pulse rounded-xl bg-surface" />
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
            <Package aria-hidden="true" className="size-7" />
          </span>
          <p className="mt-4 text-xl font-bold text-foreground">No orders yet</p>
          <Link href="/shop" className={`${btnPrimary} mt-5`}>
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.number} className="animate-fade-in overflow-hidden rounded-xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-surface px-4 py-3 text-[13px]">
                <span>
                  <span className="block text-muted-foreground">Order placed</span>
                  <span className="font-semibold text-foreground">{new Date(order.placedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                </span>
                <span>
                  <span className="block text-muted-foreground">Total</span>
                  <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
                </span>
                <span>
                  <span className="block text-muted-foreground">Payment</span>
                  <span className="font-semibold text-foreground">{paymentMethods.find((m) => m.id === order.paymentMethod)?.label}</span>
                </span>
                <span className="ml-auto">
                  <span className="block text-muted-foreground">Order #</span>
                  <span className="font-semibold text-foreground">{order.number}</span>
                </span>
              </div>
              <ul className="divide-y divide-border px-4">
                {order.lines.map((line) => (
                  <li key={line.slug} className="flex items-center justify-between gap-4 py-3 text-[15px]">
                    <Link href={`/product/${line.slug}`} className="-my-1.5 min-w-0 py-3 text-foreground hover:text-primary hover:underline">
                      {line.name} <span className="text-muted-foreground">× {line.qty}</span>
                    </Link>
                    <span className="shrink-0 font-semibold tabular-nums">{formatPrice(line.price * line.qty)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
