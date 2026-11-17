"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CircleCheck, FileText, X } from "lucide-react";
import { submitRequest } from "@/actions/forms";
import { Honeypot } from "@/components/honeypot";
import type { Product } from "@/lib/catalog";
import { btnOutline, btnPrimary, inputClass, labelClass } from "@/lib/ui";

/*
 * Quote requests and part requests: validated here, then saved and emailed to the sales
 * team by the server (src/actions/forms.ts).
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An email address, or a phone number of at least 7 digits. */
function isEmailOrPhone(value: string) {
  return value.includes("@") ? emailPattern.test(value) : /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 7;
}

type FieldDef = {
  name: string;
  label: string;
  /** "contact" accepts an email address or a phone number. */
  type?: "text" | "email" | "contact" | "number" | "textarea";
  /** Up/down arrow buttons that step a whole number (minimum 1). */
  stepper?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  prefix?: string;
  hint?: string;
  validate?: (value: string) => string | null;
  half?: boolean;
};

function RequestForm({
  kind,
  fields,
  initial,
  submitLabel,
  onDone,
}: {
  kind: "quote" | "part";
  fields: FieldDef[];
  initial: Record<string, string>;
  submitLabel: string;
  onDone?: () => void;
}) {
  const formId = useId();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState("");
  const [website, setWebsite] = useState("");

  function validate() {
    const found: Record<string, string> = {};
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (field.required && !value) found[field.name] = `Enter ${field.label.toLowerCase()}.`;
      else if (value && field.type === "email" && !emailPattern.test(value)) found[field.name] = "Enter a valid email address, like name@company.com.";
      else if (value && field.type === "contact" && !isEmailOrPhone(value)) found[field.name] = "Enter a valid email address or phone number.";
      else if (value && field.validate) {
        const message = field.validate(value);
        if (message) found[field.name] = message;
      }
    }
    return found;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    const first = fields.find((field) => found[field.name]);
    if (first) {
      document.getElementById(`${formId}-${first.name}`)?.focus();
      return;
    }
    setState("sending");
    setFormError("");
    try {
      const result = await submitRequest({ ...values, kind, website });
      if (result.ok) return setState("done");
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error ?? (result.fieldErrors ? "" : "Your request couldn't be sent. Please try again."));
    } catch {
      setFormError("Your request couldn't be sent. Check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div role="status" className="animate-fade-up rounded-2xl bg-primary-soft p-5">
        <p className="flex items-center gap-2.5 text-lg font-bold text-primary">
          <CircleCheck aria-hidden="true" className="size-6 shrink-0" />
          {kind === "quote" ? "Quote request sent" : "Part request sent"}
        </p>
        <p className="mt-2 text-[15px] text-foreground">
          Thanks, {(values.name ?? "").trim().split(" ")[0]}. Our team will get back to you at {values.email}.
        </p>
        {onDone && (
          <button type="button" onClick={onDone} className={`${btnOutline} mt-4`}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative grid gap-4 sm:grid-cols-2">
      <Honeypot value={website} onChange={setWebsite} />
      {formError && (
        <p role="alert" className="rounded-2xl border border-sale/40 bg-sale/5 p-4 font-semibold text-sale sm:col-span-2">
          {formError}
        </p>
      )}
      {fields.map((field) => {
        const id = `${formId}-${field.name}`;
        const error = errors[field.name];
        const describedBy = [error ? `${id}-error` : "", field.hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
        const common = {
          id,
          name: field.name,
          value: values[field.name] ?? "",
          readOnly: field.readOnly,
          required: field.required,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setValues((current) => ({ ...current, [field.name]: event.target.value }));
            if (errors[field.name]) setErrors((current) => ({ ...current, [field.name]: "" }));
          },
        };
        const step = (by: number) => {
          const current = Number.parseInt(values[field.name] ?? "", 10);
          const next = Math.max(1, (Number.isFinite(current) ? current : 0) + by);
          setValues((all) => ({ ...all, [field.name]: String(next) }));
          if (errors[field.name]) setErrors((all) => ({ ...all, [field.name]: "" }));
        };
        const stepButton = "grid flex-1 w-10 place-items-center text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground";
        return (
          <div key={field.name} className={field.half ? "" : "sm:col-span-2"}>
            <label htmlFor={id} className={labelClass}>
              {field.label}
              {field.required && (
                <span aria-hidden="true" className="ml-0.5 text-sale">
                  *
                </span>
              )}
              {!field.required && !field.readOnly && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea {...common} rows={3} className={`${inputClass} py-3`} />
            ) : (
              <div className="relative">
                {field.prefix && (
                  <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                    {field.prefix}
                  </span>
                )}
                <input
                  {...common}
                  type={field.type === "number" || field.type === "contact" ? "text" : (field.type ?? "text")}
                  inputMode={field.inputMode}
                  autoComplete={field.autoComplete}
                  onKeyDown={
                    field.stepper
                      ? (event) => {
                          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                            event.preventDefault();
                            step(event.key === "ArrowUp" ? 1 : -1);
                          }
                        }
                      : undefined
                  }
                  className={`${inputClass} ${field.prefix ? "pl-8" : ""} ${field.stepper ? "pr-12" : ""} ${field.readOnly ? "bg-surface font-semibold" : ""}`}
                />
                {field.stepper && (
                  <div className="absolute inset-y-px right-px flex flex-col overflow-hidden rounded-r-[7px] border-l border-foreground/25">
                    <button type="button" tabIndex={-1} aria-label={`Increase ${field.label.toLowerCase()}`} onClick={() => step(1)} className={stepButton}>
                      <ChevronUp aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Decrease ${field.label.toLowerCase()}`}
                      onClick={() => step(-1)}
                      className={`${stepButton} border-t border-foreground/25`}
                    >
                      <ChevronDown aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
            {field.hint && !error && (
              <p id={`${id}-hint`} className="mt-1 text-[13px] text-muted-foreground">
                {field.hint}
              </p>
            )}
            {error && (
              <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-sale">
                {error}
              </p>
            )}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <button type="submit" disabled={state === "sending"} className={`${btnPrimary} min-h-12 w-full sm:w-auto`}>
          {state === "sending" ? "Sending…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

const positiveNumber = (label: string) => (value: string) =>
  /^\d+(\.\d{1,2})?$/.test(value.replace(/,/g, "")) && Number(value.replace(/,/g, "")) > 0 ? null : `Enter ${label} as a number.`;

/** "Add to Quote" button + dialog on the product page (opens automatically for #quote links). */
export function QuoteRequest({
  product,
  prominent = false,
  className,
  label = "Request a quote",
}: {
  product: Product;
  prominent?: boolean;
  /** Replaces the default full-width button styling of the trigger. */
  className?: string;
  label?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (window.location.hash !== "#quote") return;
    const timer = window.setTimeout(() => setOpen(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFormKey((key) => key + 1);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className={className ?? `${prominent ? btnPrimary : btnOutline} min-h-12 w-full`}
      >
        <FileText aria-hidden="true" className="size-[18px]" />
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className="modal"
        style={{ width: "min(640px, calc(100vw - 24px))" }}
        aria-labelledby="quote-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="max-h-[calc(100dvh-24px)] overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="quote-title" className="text-xl font-bold text-foreground">
                Request a quote
              </h2>
              <p className="mt-1 text-[14px] text-muted-foreground">{product.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-150 hover:bg-surface"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="mt-5">
            <RequestForm
              key={formKey}
              kind="quote"
              submitLabel="Send quote request"
              onDone={() => setOpen(false)}
              initial={{ part: product.mpn, quantity: "1" }}
              fields={[
                { name: "part", label: "Part number", readOnly: true },
                { name: "name", label: "Your name", required: true, autoComplete: "name", half: true },
                { name: "email", label: "Email Address or Phone Number", type: "contact", required: true, autoComplete: "email", half: true },
                { name: "targetPrice", label: "Target price (each)", type: "number", inputMode: "decimal", prefix: "$", half: true, validate: positiveNumber("a target price"), hint: "Optional. Helps us match your budget." },
                { name: "quantity", label: "Quantity", type: "number", required: true, inputMode: "numeric", stepper: true, half: true, validate: (v) => (/^\d+$/.test(v) && Number(v) > 0 ? null : "Enter a whole number of 1 or more.") },
                { name: "message", label: "Notes", type: "textarea" },
              ]}
            />
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Shown on the search page when a part number isn't listed. */
export function PartRequestForm({ partNumber }: { partNumber: string }) {
  return (
    <RequestForm
      kind="part"
      submitLabel="Submit part request"
      initial={{ part: partNumber }}
      fields={[
        { name: "name", label: "Name", required: true, autoComplete: "name", half: true },
        { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", inputMode: "email", half: true },
        { name: "part", label: "Requested part number", required: true },
        { name: "message", label: "Additional message or comments", type: "textarea" },
      ]}
    />
  );
}
