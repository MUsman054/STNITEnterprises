"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleCheck, FileText, X } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { site } from "@/lib/site";
import { btnOutline, btnPrimary, inputClass, labelClass } from "@/lib/ui";

/*
 * Quote requests and part requests. These validate in the browser but are NOT sent
 * anywhere yet: connect `submitRequest` to the client's email service or CRM (for example
 * an API route that emails sales@) when the backend is set up.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea";
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  prefix?: string;
  hint?: string;
  validate?: (value: string) => string | null;
  half?: boolean;
};

async function submitRequest(kind: "quote" | "part", values: Record<string, string>) {
  // DEMO: replace with a POST to the backend.
  void kind;
  void values;
  await new Promise((resolve) => setTimeout(resolve, 500));
}

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

  function validate() {
    const found: Record<string, string> = {};
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (field.required && !value) found[field.name] = `Enter ${field.label.toLowerCase()}.`;
      else if (value && field.type === "email" && !emailPattern.test(value)) found[field.name] = "Enter a valid email address, like name@company.com.";
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
    await submitRequest(kind, values);
    setState("done");
  }

  if (state === "done") {
    return (
      <div role="status" className="animate-fade-up rounded-2xl bg-primary-soft p-5">
        <p className="flex items-center gap-2.5 text-lg font-bold text-primary">
          <CircleCheck aria-hidden="true" className="size-6 shrink-0" />
          {kind === "quote" ? "Quote request ready" : "Part request ready"}
        </p>
        <p className="mt-2 text-[15px] text-foreground">
          Thanks, {(values.name ?? "").trim().split(" ")[0]}. Our team will get back to you at {values.email}.
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Demo note: this form isn&apos;t connected yet, so nothing was sent. You can reach us now at {site.contact.salesEmail}.
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
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
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
        return (
          <div key={field.name} className={field.half ? "" : "sm:col-span-2"}>
            <label htmlFor={id} className={labelClass}>
              {field.label}
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
                  type={field.type === "number" ? "text" : (field.type ?? "text")}
                  inputMode={field.inputMode}
                  autoComplete={field.autoComplete}
                  className={`${inputClass} ${field.prefix ? "pl-8" : ""} ${field.readOnly ? "bg-surface font-semibold" : ""}`}
                />
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
                { name: "email", label: "Email address", type: "email", required: true, autoComplete: "email", inputMode: "email", half: true },
                { name: "targetPrice", label: "Target price (each)", type: "number", inputMode: "decimal", prefix: "$", half: true, validate: positiveNumber("a target price"), hint: "Optional. Helps us match your budget." },
                { name: "quantity", label: "Quantity", type: "number", required: true, inputMode: "numeric", half: true, validate: (v) => (/^\d+$/.test(v) && Number(v) > 0 ? null : "Enter a whole number of 1 or more.") },
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
