"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { CircleCheck, Heart, Package, ShoppingCart } from "lucide-react";
import { login, requestPasswordReset, resetPassword, signup } from "@/actions/auth";
import { addToCart } from "@/lib/cart-store";
import { brandName, getProduct, type Product } from "@/lib/catalog";
import { removeFromWishlist, useWishlist } from "@/lib/wishlist-store";
import { useHydrated } from "@/lib/cart-store";
import { btnOutline, btnPrimary, cardClass, inputClass, labelClass } from "@/lib/ui";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FormAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl border border-sale/40 bg-sale/5 p-4 text-[15px] font-semibold text-sale">
      {message}
    </p>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  error,
  optional,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  value: string;
  error?: string;
  optional?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

/** Login / Signup, backed by src/actions/auth.ts. `next` is where to go after signing in. */
export function AuthView({ next }: { next?: string }) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const base = useId();
  const [values, setValues] = useState({ name: "", email: "", password: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const found: Record<string, string> = {};
    if (tab === "signup" && !values.name.trim()) found.name = "Enter your name.";
    if (!values.email.trim()) found.email = "Enter your email address.";
    else if (!emailPattern.test(values.email.trim())) found.email = "Enter a valid email address.";
    if (!values.password) found.password = "Enter your password.";
    else if (tab === "signup" && values.password.length < 8) found.password = "Use at least 8 characters.";
    setErrors(found);
    setFormError("");
    const first = ["name", "email", "password"].find((key) => found[key]);
    if (first) {
      document.getElementById(`${base}-${first}`)?.focus();
      return;
    }
    startTransition(async () => {
      // On success the action redirects, so only failures come back here.
      const result =
        tab === "login"
          ? await login({ email: values.email, password: values.password }, next)
          : await signup(values, next);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "");
        setValues((current) => ({ ...current, password: "" }));
      }
    });
  }

  const field = (name: keyof typeof values, label: string, type: string, autoComplete: string, optional = false) => (
    <Field
      id={`${base}-${name}`}
      label={label}
      type={type}
      autoComplete={autoComplete}
      optional={optional}
      value={values[name]}
      error={errors[name]}
      onChange={(value) => {
        setValues((current) => ({ ...current, [name]: value }));
        if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
      }}
    />
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
                setFormError("");
              }}
              className={`min-h-11 rounded-full text-[15px] font-semibold transition-colors duration-200 ${tab === key ? "bg-background text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}
            >
              {key === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
          <FormAlert message={formError} />
          {tab === "signup" && field("name", "Full name", "text", "name")}
          {tab === "signup" && field("company", "Company", "text", "organization", true)}
          {field("email", "Email address", "email", "email")}
          {field("password", "Password", "password", tab === "login" ? "current-password" : "new-password")}
          {tab === "login" && (
            <Link href="/account/forgot-password" className="-mt-1 justify-self-start py-1 text-[14px] font-semibold text-primary underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          )}
          <button type="submit" disabled={pending} className={`${btnPrimary} min-h-12 w-full disabled:opacity-70`}>
            {pending ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
          </button>
          <p className="text-center text-[13px] text-muted-foreground">You can also check out as a guest without an account.</p>
        </form>
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

/** "Forgot password" form. Always shows the same confirmation, so it can't reveal who has an account. */
export function ForgotPasswordForm() {
  const base = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      document.getElementById(`${base}-email`)?.focus();
      return;
    }
    setError("");
    setFormError("");
    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (result.ok) return setDone(true);
      setError(result.fieldErrors?.email ?? "");
      setFormError(result.error ?? "");
    });
  }

  if (done) {
    return (
      <p role="status" className="animate-fade-up mt-6 flex items-start gap-3 rounded-2xl bg-primary-soft p-5 text-[15px] text-foreground">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        If an account exists for {email.trim()}, we&apos;ve sent a link to reset the password. It expires in 1 hour. Check your spam folder if you don&apos;t see it.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
      <FormAlert message={formError} />
      <Field id={`${base}-email`} label="Email address" type="email" autoComplete="email" value={email} error={error} onChange={setEmail} />
      <button type="submit" disabled={pending} className={`${btnPrimary} min-h-12 w-full disabled:opacity-70`}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/account" className="justify-self-center py-2 text-[14px] font-semibold text-primary underline-offset-4 hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const base = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (password.length < 8) found.password = "Use at least 8 characters.";
    else if (password !== confirm) found.confirm = "The passwords don't match.";
    setErrors(found);
    setFormError("");
    if (found.password || found.confirm) return;
    startTransition(async () => {
      const result = await resetPassword({ token, password });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "");
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
      <FormAlert message={formError} />
      <Field id={`${base}-password`} label="New password" type="password" autoComplete="new-password" value={password} error={errors.password} onChange={setPassword} />
      <Field id={`${base}-confirm`} label="Confirm new password" type="password" autoComplete="new-password" value={confirm} error={errors.confirm} onChange={setConfirm} />
      <button type="submit" disabled={pending} className={`${btnPrimary} min-h-12 w-full disabled:opacity-70`}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
