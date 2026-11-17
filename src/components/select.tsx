"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

/**
 * Dropdown styled like the header's category picker (instead of the browser's native list).
 * Keyboard: Enter/Space/arrows open it, arrows move, Home/End jump, Escape closes.
 * Label it with <label id=...> and pass that id as `labelledBy`.
 */
export function Select({
  id,
  value,
  options,
  onChange,
  labelledBy,
  className = "",
}: {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  labelledBy?: string;
  className?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (open) optionRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, selectedIndex]);

  function openAt(index: number) {
    setOpen(true);
    requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function close(returnFocus = false) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function pick(next: string) {
    onChange(next);
    close(true);
  }

  function handleOptionKey(event: React.KeyboardEvent, index: number) {
    const last = options.length - 1;
    const move = (to: number) => {
      event.preventDefault();
      optionRefs.current[to]?.focus();
    };
    if (event.key === "ArrowDown") move(index === last ? 0 : index + 1);
    else if (event.key === "ArrowUp") move(index === 0 ? last : index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(last);
    else if (event.key === "Tab") close();
  }

  return (
    <div
      className={`relative ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy && id ? `${labelledBy} ${id}` : undefined}
        onClick={() => (open ? close() : openAt(selectedIndex))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openAt(selectedIndex);
          }
        }}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border bg-background px-4 text-left text-base text-foreground transition-[border-color,box-shadow] duration-200 hover:border-foreground/50 focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--color-primary-soft)] focus-visible:outline-none ${
          open ? "border-primary shadow-[0_0_0_3px_var(--color-primary-soft)]" : "border-foreground/25"
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        className={`absolute top-full right-0 left-0 z-50 pt-2 transition-[opacity,translate,visibility] duration-150 ease-out ${
          open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
        }`}
      >
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          className="max-h-[min(60vh,360px)] overflow-y-auto rounded-2xl border border-border bg-background p-2 text-foreground shadow-pop"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={open ? 0 : -1}
                  onClick={() => pick(option.value)}
                  onKeyDown={(event) => handleOptionKey(event, index)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-[15px] transition-colors duration-150 hover:bg-primary-soft hover:text-primary focus-visible:bg-primary-soft focus-visible:text-primary focus-visible:outline-none ${
                    isSelected ? "font-semibold text-primary" : "text-foreground"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.5} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
