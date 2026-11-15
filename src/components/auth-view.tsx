"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { Check, CircleAlert, Eye, EyeOff, FileText, LockKeyhole, Package, Truck } from "lucide-react";
import { login, signup } from "@/actions/auth";
import { LogoLockup } from "@/components/logo";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui";

type Mode = "login" | "signup";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Messages for ?error= values set by the Google sign-in routes. */
const oauthErrors: Record<string, string> = {
  google_unavailable: "Google sign-in isn't available right now. Please use your email and password.",
  google_cancelled: "Google sign-in was cancelled. Choose an account to continue, or use your email.",
  google_expired: "That Google sign-in took too long or was opened in another tab. Please try again.",
  google_unverified: "Your Google email address isn't verified yet. Verify it with Google, or sign up with email.",
  google_failed: "We couldn't sign you in with Google. Please try again in a moment.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
};

const benefits = [
  { icon: Truck, title: "Faster checkout", text: "Saved details so you can order in seconds." },
  { icon: Package, title: "Track every order", text: "Status, tracking numbers and order history in one place." },
  { icon: FileText, title: "Business quotes", text: "Request bulk pricing and keep your quotes together." },
];

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-sale">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

function TextField(props: {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  value: string;
  error?: string;
  optional?: boolean;
  inputMode?: "email" | "text";
  onChange: (value: string) => void;
}) {
  const { id, label, type = "text", autoComplete, value, error, optional, inputMode, onChange } = props;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={type === "email" ? false : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function PasswordField(props: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  error?: string;
  hint?: string;
  labelAside?: React.ReactNode;
  onChange: (value: string) => void;
}) {
  const { id, label, autoComplete, value, error, hint, labelAside, onChange } = props;
  const [visible, setVisible] = useState(false);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={`${labelClass} mb-0`}>
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Sign in / Create account, backed by src/actions/auth.ts and the Google routes in src/app/api/auth. */
export function AuthView({
  next = "/account",
  initialMode = "login",
  googleEnabled,
  oauthError,
}: {
  next?: string;
  initialMode?: Mode;
  googleEnabled: boolean;
  oauthError?: string;
}) {
  const base = useId();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState({ name: "", company: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(oauthError ? (oauthErrors[oauthError] ?? oauthErrors.google_failed) : "");
  const [pending, startTransition] = useTransition();
  const isSignup = mode === "signup";
  const googleHref = `/api/auth/google?next=${encodeURIComponent(next)}`;

  function switchMode(target: Mode) {
    setMode(target);
    setErrors({});
    setFormError("");
    setValues((current) => ({ ...current, password: "", confirm: "" }));
    // Keep the URL shareable (?mode=signup) without a navigation.
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    if (target === "signup") url.searchParams.set("mode", "signup");
    else url.searchParams.delete("mode");
    window.history.replaceState(null, "", url);
  }

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const found: Record<string, string> = {};
    const email = values.email.trim();
    if (isSignup && !values.name.trim()) found.name = "Enter your full name.";
    if (!email) found.email = "Enter your email address.";
    else if (!emailPattern.test(email)) found.email = "Enter a valid email address, like name@example.com.";
    if (!values.password) found.password = "Enter your password.";
    else if (isSignup && values.password.length < 8) found.password = "Use at least 8 characters.";
    if (isSignup && !found.password && values.confirm !== values.password) found.confirm = "Passwords don't match. Type the same password twice.";
    setErrors(found);
    setFormError("");
    const first = ["name", "email", "password", "confirm"].find((key) => found[key]);
    if (first) {
      document.getElementById(`${base}-${first}`)?.focus();
      return;
    }
    startTransition(async () => {
      // On success the action redirects, so only failures come back here.
      const result = isSignup
        ? await signup({ name: values.name, company: values.company, email, password: values.password }, next)
        : await login({ email, password: values.password }, next);
      if (!result.ok) {
        const fieldErrors = result.fieldErrors ?? {};
        setErrors(fieldErrors);
        setFormError(result.error ?? "");
        setValues((current) => ({ ...current, password: "", confirm: "" }));
        const focus = ["name", "email", "password"].find((key) => fieldErrors[key]);
        if (focus) document.getElementById(`${base}-${focus}`)?.focus();
      }
    });
  }

  return (
    <div className="mx-auto mt-2 grid max-w-5xl overflow-hidden rounded-2xl bg-background shadow-card lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-nav p-10 text-white lg:flex" aria-label="Why create an account">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative">
          <LogoLockup tone="dark" className="text-[17px]" />
          <h2 className="mt-10 font-display text-[28px] font-bold leading-tight">
            {isSignup ? "Create your free account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-[15px] text-nav-muted">
            {isSignup ? "Create a free account to shop servers, networking and parts faster." : "Sign in to check out faster and keep track of your orders."}
          </p>
          <ul className="mt-8 space-y-5">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-lime">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="block text-[14px] text-nav-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-10 flex items-center gap-2 text-[13px] text-nav-muted">
          <LockKeyhole aria-hidden="true" className="size-4 text-lime" />
          Your password is encrypted and never stored in plain text.
        </p>
      </aside>

      {/* Form */}
      <section className="p-5 sm:p-10" aria-labelledby={`${base}-title`}>
        <div className="mx-auto max-w-md">
          <h1 id={`${base}-title`} className="text-[28px] font-bold leading-tight text-foreground">
            {isSignup ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to STN IT Enterprise? "}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? "login" : "signup")}
              className="font-semibold text-primary underline-offset-4 hover:text-primary-hover hover:underline"
            >
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>

          {formError && (
            <p role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-sale/30 bg-sale/5 p-4 text-[15px] font-medium text-sale">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {formError}
            </p>
          )}

          {googleEnabled && (
            <>
              <a
                href={googleHref}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-foreground/20 bg-background px-6 text-[15px] font-semibold text-foreground transition-[background-color,border-color,box-shadow] duration-200 hover:border-foreground/40 hover:bg-surface hover:shadow-sm"
              >
                <GoogleIcon />
                Continue with Google
              </a>
              <div className="my-6 flex items-center gap-4 text-[13px] text-muted-foreground" role="separator" aria-label="or">
                <span className="h-px flex-1 bg-border" />
                or continue with email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} noValidate className={`grid gap-4 ${googleEnabled ? "" : "mt-6"}`}>
            {isSignup && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id={`${base}-name`} label="Full name" autoComplete="name" value={values.name} error={errors.name} onChange={(v) => update("name", v)} />
                <TextField id={`${base}-company`} label="Company" autoComplete="organization" optional value={values.company} error={errors.company} onChange={(v) => update("company", v)} />
              </div>
            )}
            <TextField
              id={`${base}-email`}
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete={isSignup ? "email" : "username"}
              value={values.email}
              error={errors.email}
              onChange={(v) => update("email", v)}
            />
            {errors.email && !isSignup && errors.email.startsWith("We couldn't find") && (
              <button type="button" onClick={() => switchMode("signup")} className="-mt-2 justify-self-start text-[14px] font-semibold text-primary underline-offset-4 hover:underline">
                Create an account with this email →
              </button>
            )}
            <PasswordField
              id={`${base}-password`}
              label="Password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={values.password}
              error={errors.password}
              hint={isSignup ? "At least 8 characters. A mix of letters, numbers and symbols is strongest." : undefined}
              labelAside={
                !isSignup && (
                  <Link href="/account/forgot-password" className="text-[14px] font-semibold text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                )
              }
              onChange={(v) => update("password", v)}
            />
            {isSignup && (
              <PasswordField
                id={`${base}-confirm`}
                label="Confirm password"
                autoComplete="new-password"
                value={values.confirm}
                error={errors.confirm}
                onChange={(v) => update("confirm", v)}
              />
            )}

            <button type="submit" disabled={pending} className={`${btnPrimary} mt-2 min-h-12 w-full disabled:opacity-70`}>
              {pending ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>

            {isSignup ? (
              <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/support/terms-conditions" className="font-medium text-foreground underline underline-offset-2">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/support/privacy-policy" className="font-medium text-foreground underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-center text-[13px] text-muted-foreground">
                <Check aria-hidden="true" className="size-4 text-primary" />
                You&apos;ll stay signed in on this device for 30 days.
              </p>
            )}
          </form>

          <div className="mt-8 rounded-xl bg-surface p-4 text-center text-[14px] text-muted-foreground">
            Just want to buy?{" "}
            <Link href="/cart" className="font-semibold text-primary underline-offset-4 hover:underline">
              Check out as a guest
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
