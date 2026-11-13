"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { MAX_QTY } from "@/lib/cart-store";

type Props = {
  value: number;
  onChange: (next: number) => void;
  /** Used in the accessible names, e.g. "Decrease quantity of Zebra GX420t". */
  label: string;
  /** When set, the minus button becomes a remove button at quantity 1. */
  onRemove?: () => void;
  size?: "sm" | "md";
  /** Stretch to fill the parent's width (product cards). */
  block?: boolean;
};

export function QuantityStepper({ value, onChange, label, onRemove, size = "md", block = false }: Props) {
  // While someone is typing we keep their raw text, so the field can be cleared and
  // retyped. The real quantity only changes when the text is a valid number.
  const [draft, setDraft] = useState<string | null>(null);

  const cell = size === "md" ? "size-12" : "size-11";
  const buttonClass = `grid ${cell} shrink-0 place-items-center rounded-full text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary disabled:pointer-events-none disabled:opacity-35`;
  const showRemove = Boolean(onRemove) && value <= 1;

  return (
    <div
      className={`${block ? "flex w-full justify-between" : "inline-flex"} items-center rounded-full border border-foreground/25 bg-background`}
    >
      <button
        type="button"
        className={`${buttonClass} ${showRemove ? "hover:bg-sale/10 hover:text-sale" : ""}`}
        onClick={() => {
          setDraft(null);
          if (showRemove) onRemove?.();
          else onChange(value - 1);
        }}
        disabled={!showRemove && value <= 1}
        aria-label={showRemove ? `Remove ${label} from cart` : `Decrease quantity of ${label}`}
      >
        {showRemove ? (
          <Trash2 aria-hidden="true" className="size-4" />
        ) : (
          <Minus aria-hidden="true" className="size-4" />
        )}
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={draft ?? String(value)}
        onFocus={(event) => event.target.select()}
        onChange={(event) => {
          const text = event.target.value.replace(/\D/g, "").slice(0, 2);
          setDraft(text);
          const next = Number.parseInt(text, 10);
          if (Number.isFinite(next) && next >= 1) onChange(Math.min(next, MAX_QTY));
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" && value < MAX_QTY) {
            event.preventDefault();
            setDraft(null);
            onChange(value + 1);
          }
          if (event.key === "ArrowDown" && value > 1) {
            event.preventDefault();
            setDraft(null);
            onChange(value - 1);
          }
        }}
        aria-label={`Quantity of ${label}`}
        className="h-11 w-10 min-w-0 bg-transparent text-center text-base font-semibold text-foreground tabular-nums"
      />
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          setDraft(null);
          onChange(value + 1);
        }}
        disabled={value >= MAX_QTY}
        aria-label={`Increase quantity of ${label}`}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
