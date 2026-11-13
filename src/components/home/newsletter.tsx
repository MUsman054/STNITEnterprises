"use client";

import { useState } from "react";
import { CircleCheck, Mail } from "lucide-react";
import { btnPrimary, inputClass } from "@/lib/ui";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up. Validates in the browser only: it is NOT connected to a mailing
 * service yet. Wire `handleSubmit` to the client's email provider before launch.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
    setDone(true);
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
        <form onSubmit={handleSubmit} noValidate>
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
            <button type="submit" className={`${btnPrimary} min-h-12 shrink-0`}>
              Subscribe
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
