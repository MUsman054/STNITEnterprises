"use client";

import { useId, useState, useTransition } from "react";
import { acceptInvite, acceptInviteWithNewAccount } from "@/actions/team";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui";

function FormAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl border border-sale/40 bg-sale/5 p-4 text-[15px] font-semibold text-sale">
      {message}
    </p>
  );
}

export function AcceptInviteButton({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-6 grid gap-3">
      <FormAlert message={error} />
      <button
        type="button"
        disabled={pending}
        className={`${btnPrimary} min-h-12 w-full`}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvite({ token });
            if (!result.ok) setError(result.error ?? "Something went wrong.");
          })
        }
      >
        {pending ? "Joining…" : "Accept invitation"}
      </button>
    </div>
  );
}

export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const base = useId();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "Enter your name.";
    if (password.length < 8) found.password = "Use at least 8 characters.";
    else if (password !== confirm) found.confirm = "The passwords don't match.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;
    startTransition(async () => {
      const result = await acceptInviteWithNewAccount({ token, name, password });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "");
      }
    });
  }

  const field = (key: "name" | "password" | "confirm", label: string, type: string, autoComplete: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label htmlFor={`${base}-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`${base}-${key}`}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `${base}-${key}-error` : undefined}
        className={inputClass}
      />
      {errors[key] && (
        <p id={`${base}-${key}-error`} className="mt-1.5 text-sm font-medium text-sale">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="mt-4 grid gap-4">
      <FormAlert message={formError} />
      <div>
        <label htmlFor={`${base}-email`} className={labelClass}>
          Email
        </label>
        <input id={`${base}-email`} type="email" value={email} readOnly autoComplete="username" className={`${inputClass} bg-surface`} />
      </div>
      {field("name", "Your name", "text", "name", name, setName)}
      {field("password", "Choose a password", "password", "new-password", password, setPassword)}
      {field("confirm", "Confirm password", "password", "new-password", confirm, setConfirm)}
      <button type="submit" disabled={pending} className={`${btnPrimary} min-h-12 w-full`}>
        {pending ? "Creating account…" : "Create account and join"}
      </button>
    </form>
  );
}
