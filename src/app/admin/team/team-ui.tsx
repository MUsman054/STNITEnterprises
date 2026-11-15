"use client";

import { useId, useState, useTransition } from "react";
import { cancelInvite, changeStaffRole, inviteStaff, removeStaff, resendInvite } from "@/actions/team";
import { btnOutline, btnPrimary, inputClass, labelClass } from "@/lib/ui";

type RoleOption = { value: "admin" | "sales"; label: string; description?: string };

const smallButton = "min-h-10 rounded-full border border-border px-3 text-[13px] font-semibold whitespace-nowrap hover:bg-surface disabled:opacity-60";

function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-[14px] font-semibold text-sale">
      {message}
    </p>
  );
}

/** Shows the invite link after sending, so it can also be shared by hand (or used when email isn't set up). */
function InviteLink({ link, emailed, email }: { link: string; emailed: boolean; email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="mt-4 rounded-2xl bg-primary-soft p-4 text-[14px] text-foreground">
      <p className="font-semibold">
        {emailed ? `Invitation emailed to ${email}.` : `Invitation created, but the email could not be sent. Send ${email} this link yourself:`}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input readOnly value={link} aria-label="Invitation link" onFocus={(e) => e.currentTarget.select()} className={`${inputClass} min-h-10 flex-1 text-[13px]`} />
        <button
          type="button"
          className={smallButton}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
      <p className="mt-2 text-muted-foreground">This link is shown only once. It works once and expires in 72 hours.</p>
    </div>
  );
}

export function InviteForm({ roles }: { roles: RoleOption[] }) {
  const base = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleOption["value"]>(roles[roles.length - 1].value);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState<{ link: string; emailed: boolean; email: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError("");
    setSent(null);
    startTransition(async () => {
      const result = await inviteStaff({ email, role });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "");
        return;
      }
      setSent({ link: result.link, emailed: result.emailed, email: email.trim().toLowerCase() });
      setEmail("");
    });
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <label htmlFor={`${base}-email`} className={labelClass}>
            Email address
          </label>
          <input
            id={`${base}-email`}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${base}-email-error` : undefined}
            className={inputClass}
            placeholder="name@company.com"
          />
          {errors.email && (
            <p id={`${base}-email-error`} className="mt-1.5 text-sm font-medium text-sale">
              {errors.email}
            </p>
          )}
        </div>
        <fieldset className="sm:col-span-2">
          <legend className={labelClass}>Role</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-checked:border-primary has-checked:bg-primary-soft/50">
                <input type="radio" name={`${base}-role`} value={option.value} checked={role === option.value} onChange={() => setRole(option.value)} className="mt-1 size-4 accent-primary" />
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-[13px] text-muted-foreground">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.role && <p className="mt-1.5 text-sm font-medium text-sale">{errors.role}</p>}
        </fieldset>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={`${btnPrimary} min-h-12`}>
            {pending ? "Sending…" : "Send invitation"}
          </button>
          <ErrorText message={formError} />
        </div>
      </form>
      {sent && <InviteLink {...sent} />}
    </>
  );
}

export function MemberActions({ userId, name, role, roles }: { userId: string; name: string; role: RoleOption["value"]; roles: Omit<RoleOption, "description">[] }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {roles.length > 1 && (
        <select
          aria-label={`Role for ${name}`}
          value={role}
          disabled={pending}
          onChange={(e) => run(() => changeStaffRole({ userId, role: e.target.value }))}
          className="min-h-10 rounded-full border border-border bg-background px-3 text-[13px] font-semibold"
        >
          {roles.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={pending}
        className={`${smallButton} text-sale`}
        onClick={() => {
          if (window.confirm(`Remove ${name} from the team? They keep their customer account but lose admin access immediately.`)) {
            run(() => removeStaff({ id: userId }));
          }
        }}
      >
        Remove
      </button>
      <ErrorText message={error} />
    </div>
  );
}

export function InviteActions({ id, email }: { id: string; email: string }) {
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ link: string; emailed: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          className={smallButton}
          onClick={() => {
            setError("");
            startTransition(async () => {
              const result = await resendInvite({ id });
              if (result.ok) setSent({ link: result.link, emailed: result.emailed });
              else setError(result.error ?? "Something went wrong.");
            });
          }}
        >
          Resend
        </button>
        <button
          type="button"
          disabled={pending}
          className={`${btnOutline} min-h-10 px-3 text-[13px]`}
          onClick={() => {
            if (!window.confirm(`Cancel the invitation for ${email}? The link will stop working.`)) return;
            setError("");
            startTransition(async () => {
              const result = await cancelInvite({ id });
              if (!result.ok) setError(result.error ?? "Something went wrong.");
            });
          }}
        >
          Cancel
        </button>
      </div>
      <ErrorText message={error} />
      {sent && (
        <div className="w-full max-w-md text-left">
          <InviteLink {...sent} email={email} />
        </div>
      )}
    </div>
  );
}
