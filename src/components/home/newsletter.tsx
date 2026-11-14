"use client";

import { useState, useTransition } from "react";
import { CircleCheck, Mail } from "lucide-react";
import { subscribeNewsletter } from "@/actions/forms";
import { Honeypot } from "@/components/honeypot";
import { btnPrimary, inputClass } from "@/lib/ui";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Newsletter sign-up. Subscribers are saved in the database (newsletter_subscribers). */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Enter your email address.");
      return;
    }
    if (!emailPattern.test(value)) {
      setError("That doesn't look like an email address. Check for typos.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await subscribeNewsletter({ email: value, website });
      if (result.ok) return setDone(true);
      setError(result.fieldErrors?.email ?? result.error ?? "Couldn't subscribe right now. Please try again.");
    });
  }

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="reveal grid items-center gap-5 rounded-2xl bg-primary-soft p-5 sm:p-7 lg:grid-cols-[1fr_minmax(0,460px)]"
    >
      <div className="flex items-start gap-4">
        <span className="hidden size-12 shrink-0 place-items-center rounded-full bg-primary text-white sm:grid">
          <Mail aria-hidden="true" className="size-[22px]" />
        </span>
        <div>
          <h2 id="newsletter-title" className="text-xl font-bold text-foreground sm:text-[22px]">
            Get new stock and price drops by email
          </h2>
          <p className="mt-1 text-muted-foreground">Occasional emails, no spam. Unsubscribe any time.</p>
        </div>
      </div>

      {done ? (
        <p role="status" className="animate-fade-up flex items-center gap-3 rounded-xl bg-background p-4 font-semibold text-primary">
          <CircleCheck aria-hidden="true" className="size-6 shrink-0" />
          Thanks, you&apos;re subscribed.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="relative">
          <Honeypot value={website} onChange={setWebsite} />
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="newsletter-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Your email address"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "newsletter-error" : undefined}
              className={`${inputClass} rounded-full! sm:flex-1`}
            />
            <button type="submit" disabled={sending} className={`${btnPrimary} min-h-12 shrink-0 disabled:opacity-70`}>
              {sending ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          {error && (
            <p id="newsletter-error" role="alert" className="mt-2 text-sm font-medium text-sale">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
