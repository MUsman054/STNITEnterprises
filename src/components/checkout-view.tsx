"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CreditCard, Info, Landmark, Lock, ShoppingBag } from "lucide-react";
import { placeOrder } from "@/actions/checkout";
import { useCart } from "@/lib/cart-store";
import { countries, paymentMethods, usStates, type PaymentMethodId } from "@/lib/order";
import { formatPrice, site } from "@/lib/site";
import { btnPrimary, cardClass, inputClass, labelClass } from "@/lib/ui";
import { ProductImage } from "@/components/product-image";

const fieldOrder = [
  "email",
  "phone",
  "firstName",
  "lastName",
  "company",
  "address1",
  "address2",
  "country",
  "state",
  "city",
  "zip",
  "notes",
  "agree",
] as const;

type FieldName = (typeof fieldOrder)[number];
type Values = Record<Exclude<FieldName, "agree">, string>;
type Errors = Partial<Record<FieldName, string>>;

const emptyValues: Values = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  country: "US",
  state: "",
  city: "",
  zip: "",
  notes: "",
};

function validate(values: Values, agree: boolean): Errors {
  const errors: Errors = {};
  const v = (name: keyof Values) => values[name].trim();

  if (!v("email")) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email")))
    errors.email = "Enter a valid email address, like name@example.com.";

  if (!v("phone")) errors.phone = "Enter a phone number we can reach you on.";
  else if (v("phone").replace(/\D/g, "").length < 10)
    errors.phone = "Enter a full phone number, including area code.";

  if (!v("firstName")) errors.firstName = "Enter your first name.";
  if (!v("lastName")) errors.lastName = "Enter your last name.";
  if (!v("address1")) errors.address1 = "Enter your street address.";
  if (!v("country")) errors.country = "Choose your country.";
  if (!v("city")) errors.city = "Enter your city.";

  // State and ZIP are required for US addresses only; many countries have neither.
  if (v("country") === "US") {
    if (!v("state")) errors.state = "Choose your state.";
    if (!v("zip")) errors.zip = "Enter your ZIP code.";
    else if (!/^\d{5}(-\d{4})?$/.test(v("zip"))) errors.zip = "Enter a 5-digit ZIP code, like 33702.";
  }

  if (!agree) errors.agree = "Please accept the terms to place your order.";
  return errors;
}

const paymentIcons: Record<PaymentMethodId, typeof CreditCard> = {
  card: CreditCard,
  bank: Landmark,
};

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-sale">
      *
    </span>
  );
}

function TextField({
  name,
  label,
  value,
  error,
  onChange,
  optional,
  ...inputProps
}: {
  name: keyof Values;
  label: string;
  value: string;
  error?: string;
  onChange: (name: keyof Values, value: string) => void;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "name">) {
  const id = `checkout-${name}`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional ? <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span> : <RequiredMark />}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required={!optional}
        className={inputClass}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

const stepHeading = "flex items-center gap-3 text-lg font-bold text-foreground";
const stepNumber =
  "grid size-8 shrink-0 place-items-center rounded-full bg-primary font-sans text-sm font-bold text-white";

export function CheckoutView({ enabledMethods }: { enabledMethods: PaymentMethodId[] }) {
  const router = useRouter();
  const { items, subtotal, hydrated } = useCart();
  const methods = paymentMethods.filter((method) => enabledMethods.includes(method.id));
  const [values, setValues] = useState<Values>(emptyValues);
  const [payment, setPayment] = useState<PaymentMethodId>(methods[0]?.id ?? "card");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();
  const placing = pending || redirecting;

  const total = subtotal + site.shipping.cost;
  const isUS = values.country === "US";
  const errorCount = Object.keys(errors).length;

  function handleChange(name: keyof Values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (placing) return;
    setFormError("");
    const found = validate(values, agree);
    setErrors(found);

    const firstInvalid = fieldOrder.find((name) => found[name]);
    if (firstInvalid) {
      document.getElementById(`checkout-${firstInvalid}`)?.focus();
      return;
    }

    // Only product slugs and quantities are sent; the server prices the order itself.
    startTransition(async () => {
      const result = await placeOrder({
        ...values,
        agree,
        payment,
        lines: items.map(({ product, qty }) => ({ slug: product.slug, qty })),
      });
      if (!result.ok) {
        const serverErrors = (result.fieldErrors ?? {}) as Errors;
        setErrors(serverErrors);
        setFormError(result.error ?? "");
        const first = fieldOrder.find((name) => serverErrors[name]);
        if (first) document.getElementById(`checkout-${first}`)?.focus();
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setRedirecting(true);
      // The cart is cleared on the confirmation page, so it survives a cancelled card payment.
      if (result.redirectUrl.startsWith("https://")) window.location.assign(result.redirectUrl);
      else router.push(result.redirectUrl);
    });
  }

  if (methods.length === 0) {
    return (
      <div className="rounded-2xl bg-background px-6 py-14 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-foreground">Online checkout is temporarily unavailable</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Please email <a className="font-semibold text-primary underline" href={`mailto:${site.contact.salesEmail}`}>{site.contact.salesEmail}</a> or
          call <a className="font-semibold text-primary underline" href={site.contact.phoneHref}>{site.contact.phone}</a> to place your order.
        </p>
      </div>
    );
  }

  if (!hydrated || redirecting) {
    return (
      <div aria-busy="true" className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="h-96 animate-pulse rounded-2xl bg-background" />
        <div className="h-72 animate-pulse rounded-2xl bg-background" />
        <p className="sr-only">{placing ? "Placing your order…" : "Loading checkout…"}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-up rounded-2xl bg-background shadow-card px-6 py-16 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
          <ShoppingBag aria-hidden="true" className="size-9" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-foreground">Nothing to check out yet</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Your cart is empty. Add a product and come back here to place your order.
        </p>
        <Link href="/shop" className={`${btnPrimary} mt-7`}>
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid items-start gap-5 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-4">
        {formError && (
          <p role="alert" className="flex items-start gap-3 rounded-2xl border border-sale/40 bg-sale/5 p-4 font-semibold text-sale">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {formError}
          </p>
        )}

        {errorCount > 0 && (
          <p role="alert" className="rounded-2xl border border-sale/40 bg-sale/5 p-4 font-semibold text-sale">
            {errorCount === 1
              ? "There is 1 field to fix before you can place your order."
              : `There are ${errorCount} fields to fix before you can place your order.`}
          </p>
        )}

        <div className={cardClass}><fieldset>
          <legend className={stepHeading}>
            <span className={stepNumber}>1</span>
            Contact details
          </legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField
              name="email"
              label="Email address"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              error={errors.email}
              onChange={handleChange}
            />
            <TextField
              name="phone"
              label="Phone number"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={values.phone}
              error={errors.phone}
              onChange={handleChange}
            />
          </div>
        </fieldset></div>

        <div className={cardClass}><fieldset>
          <legend className={stepHeading}>
            <span className={stepNumber}>2</span>
            Shipping address
          </legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField
              name="firstName"
              label="First name"
              autoComplete="given-name"
              value={values.firstName}
              error={errors.firstName}
              onChange={handleChange}
            />
            <TextField
              name="lastName"
              label="Last name"
              autoComplete="family-name"
              value={values.lastName}
              error={errors.lastName}
              onChange={handleChange}
            />
            <div className="sm:col-span-2">
              <TextField
                name="company"
                label="Company"
                optional
                autoComplete="organization"
                value={values.company}
                onChange={handleChange}
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                name="address1"
                label="Street address"
                autoComplete="address-line1"
                value={values.address1}
                error={errors.address1}
                onChange={handleChange}
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                name="address2"
                label="Apartment, suite, unit"
                optional
                autoComplete="address-line2"
                value={values.address2}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="checkout-country" className={labelClass}>
                Country
                <RequiredMark />
              </label>
              <select
                id="checkout-country"
                name="country"
                autoComplete="country"
                required
                value={values.country}
                onChange={(event) => {
                  // A US state code means nothing in another country (and vice versa), so start over.
                  setValues((current) => ({ ...current, country: event.target.value, state: "" }));
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.country;
                    delete next.state;
                    delete next.zip;
                    return next;
                  });
                }}
                aria-invalid={errors.country ? true : undefined}
                aria-describedby={errors.country ? "checkout-country-error" : undefined}
                className={inputClass}
              >
                {countries.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p id="checkout-country-error" className="mt-1.5 text-sm font-medium text-sale">
                  {errors.country}
                </p>
              )}
            </div>
            {isUS ? (
              <div>
                <label htmlFor="checkout-state" className={labelClass}>
                  State
                  <RequiredMark />
                </label>
                <select
                  id="checkout-state"
                  name="state"
                  autoComplete="address-level1"
                  required
                  value={values.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                  aria-invalid={errors.state ? true : undefined}
                  aria-describedby={errors.state ? "checkout-state-error" : undefined}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {usStates.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p id="checkout-state-error" className="mt-1.5 text-sm font-medium text-sale">
                    {errors.state}
                  </p>
                )}
              </div>
            ) : (
              <TextField
                name="state"
                label="State / Province"
                optional
                autoComplete="address-level1"
                value={values.state}
                error={errors.state}
                onChange={handleChange}
              />
            )}
            <TextField
              name="city"
              label="City"
              autoComplete="address-level2"
              value={values.city}
              error={errors.city}
              onChange={handleChange}
            />
            <TextField
              name="zip"
              label={isUS ? "ZIP code" : "ZIP / Postal code"}
              optional={!isUS}
              autoComplete="postal-code"
              inputMode={isUS ? "numeric" : "text"}
              value={values.zip}
              error={errors.zip}
              onChange={handleChange}
            />
          </div>

          <p className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 text-[15px]">
            <span>
              <span className="block font-semibold text-foreground">{site.shipping.label}</span>
              <span className="text-muted-foreground">{site.shipping.estimate}</span>
            </span>
            <span className="font-semibold text-primary">Free</span>
          </p>
        </fieldset></div>

        <div className={cardClass}><fieldset>
          <legend className={stepHeading}>
            <span className={stepNumber}>3</span>
            Payment method
          </legend>
          <div className="mt-5 space-y-3">
            {methods.map((method) => {
              const Icon = paymentIcons[method.id];
              const selected = payment === method.id;
              return (
                <div
                  key={method.id}
                  className={`rounded-2xl border transition-[border-color,background-color,box-shadow] duration-200 ${
                    selected
                      ? "border-primary bg-primary-soft/60 shadow-[0_0_0_1px_var(--color-primary)]"
                      : "border-border bg-background hover:border-foreground/30"
                  }`}
                >
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selected}
                      onChange={() => setPayment(method.id)}
                      className="size-5 accent-primary"
                    />
                    <Icon aria-hidden="true" className="size-5 text-primary" />
                    <span className="font-semibold text-foreground">{method.label}</span>
                  </label>
                  {selected && (
                    <div className="animate-fade-up px-4 pb-4">
                      <p className="rounded-xl border border-border bg-background p-4 text-[15px] text-muted-foreground">
                        {method.note}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset></div>

        <div className={cardClass}>
          <label htmlFor="checkout-notes" className={labelClass}>
            Order notes
            <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="checkout-notes"
            name="notes"
            rows={3}
            value={values.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            placeholder="Delivery instructions, purchase order number…"
            className={`${inputClass} py-3`}
          />
        </div>
      </div>

      <section
        aria-labelledby="checkout-summary-title"
        className="rounded-2xl bg-background p-5 shadow-card lg:sticky lg:top-24"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="checkout-summary-title" className="text-xl font-semibold text-foreground">
            Your order
          </h2>
          <Link
            href="/cart"
            className="-my-3 inline-block py-3 text-sm font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4 hover:text-primary-hover"
          >
            Edit cart
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-border">
          {items.map(({ product, qty, lineTotal }) => (
            <li key={product.slug} className="flex items-center gap-3 py-3">
              <div className="relative shrink-0">
                <ProductImage
                  image={product.image}
                  alt=""
                  sizes="64px"
                  className="size-16 rounded-xl border border-border"
                />
                <span className="absolute -top-2 -right-2 grid h-6 min-w-6 place-items-center rounded-full bg-foreground px-1.5 text-xs font-bold text-white tabular-nums">
                  <span className="sr-only">Quantity </span>
                  {qty}
                </span>
              </div>
              <p className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-medium text-foreground">
                {product.name}
              </p>
              <p className="shrink-0 font-semibold text-foreground tabular-nums">
                {formatPrice(lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-2 space-y-3 border-t border-border pt-4 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold text-foreground tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="font-semibold text-primary">Free</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
            <dt className="text-base font-semibold text-foreground">Total</dt>
            <dd className="font-heading text-2xl font-bold text-foreground tabular-nums">
              {formatPrice(total)}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-foreground">
            <input
              id="checkout-agree"
              type="checkbox"
              checked={agree}
              onChange={(event) => {
                setAgree(event.target.checked);
                if (errors.agree) {
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.agree;
                    return next;
                  });
                }
              }}
              aria-invalid={errors.agree ? true : undefined}
              aria-describedby={errors.agree ? "checkout-agree-error" : undefined}
              className="mt-0.5 size-5 shrink-0 accent-primary"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/support/terms-conditions"
                target="_blank"
                className="font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/support/return-policy"
                target="_blank"
                className="font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4"
              >
                Return/Refund policy
              </Link>
              .
            </span>
          </label>
          {errors.agree && (
            <p id="checkout-agree-error" className="mt-1.5 text-sm font-medium text-sale">
              {errors.agree}
            </p>
          )}
        </div>

        <button type="submit" disabled={placing} aria-busy={placing || undefined} className={`${btnPrimary} mt-5 w-full disabled:opacity-70`}>
          <Lock aria-hidden="true" className="size-4" />
          {placing
            ? "Placing your order…"
            : payment === "card"
              ? `Continue to payment · ${formatPrice(total)}`
              : `Place order · ${formatPrice(total)}`}
        </button>
        {payment === "card" && (
          <p className="mt-3 text-center text-[13px] text-muted-foreground">You&apos;ll be taken to Stripe to pay securely.</p>
        )}
      </section>
    </form>
  );
}
