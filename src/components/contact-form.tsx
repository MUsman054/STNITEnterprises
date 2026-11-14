"use client";

import { useState, useTransition } from "react";
import { CircleCheck } from "lucide-react";
import { submitContact } from "@/actions/forms";
import { Honeypot } from "@/components/honeypot";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui";

type Values = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;

/** Contact form: validated here for quick feedback, then saved and emailed by the server. */
export function ContactForm() {
  const [values, setValues] = useState<Values>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, startTransition] = useTransition();

  function update(name: keyof Values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!values.name.trim()) found.name = "Enter your name.";
    if (!values.email.trim()) found.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      found.email = "Enter a valid email address, like name@example.com.";
    if (values.message.trim().length < 10) found.message = "Tell us a little more (at least 10 characters).";
    setErrors(found);

    const first = (["name", "email", "message"] as const).find((name) => found[name]);
    if (first) {
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    setFormError("");
    startTransition(async () => {
      const result = await submitContact({ ...values, website });
      if (result.ok) return setDone(true);
      setErrors((result.fieldErrors ?? {}) as Errors);
      setFormError(result.error ?? (result.fieldErrors ? "" : "Your message couldn't be sent. Please try again."));
    });
  }

  if (done) {
    return (
      <div role="status" className="animate-fade-up rounded-2xl bg-primary-soft p-6">
        <p className="flex items-center gap-3 text-lg font-semibold text-primary">
          <CircleCheck aria-hidden="true" className="size-6 shrink-0" />
          Thanks, {values.name.trim().split(" ")[0]}. Your message was sent.
        </p>
        <p className="mt-2 text-[15px] text-foreground">
          We&apos;ll reply to {values.email.trim()} as soon as we can, usually within one business day.
        </p>
      </div>
    );
  }

  const errorText = (name: keyof Values) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className="mt-1.5 text-sm font-medium text-sale">
        {errors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="relative grid gap-5">
      <Honeypot value={website} onChange={setWebsite} />
      {formError && (
        <p role="alert" className="rounded-2xl border border-sale/40 bg-sale/5 p-4 font-semibold text-sale">
          {formError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={inputClass}
          />
          {errorText("name")}
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={inputClass}
          />
          {errorText("email")}
        </div>
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          How can we help?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          placeholder="Tell us what hardware you need, quantities and any deadlines."
          className={`${inputClass} py-3`}
        />
        {errorText("message")}
      </div>
      <div>
        <button type="submit" disabled={sending} className={`${btnPrimary} disabled:opacity-70`}>
          {sending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
