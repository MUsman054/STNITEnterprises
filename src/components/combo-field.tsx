"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass, labelClass } from "@/lib/ui";

/**
 * Text box with a site-styled suggestion list: customers can type anything or pick an
 * option (click, or arrow keys + Enter). Replaces the browser's <datalist>, whose popup
 * can't be styled and follows the OS theme (black in Windows dark mode).
 */
export function ComboField({
  id,
  name,
  label,
  value,
  options,
  onChange,
  error,
  placeholder,
  autoComplete,
}: {
  id: string;
  name: string;
  label: React.ReactNode;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // Typing filters the list (matches at the start first); an exact pick shows everything again.
  const query = value.trim().toLowerCase();
  const exact = options.some((option) => option.toLowerCase() === query);
  const shown =
    !query || exact
      ? options
      : [
          ...options.filter((option) => option.toLowerCase().startsWith(query)),
          ...options.filter((option) => !option.toLowerCase().startsWith(query) && option.toLowerCase().includes(query)),
        ];
  const expanded = open && shown.length > 0;

  useEffect(() => {
    if (!expanded || active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, expanded]);

  function choose(option: string) {
    onChange(option);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!expanded) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + shown.length) % shown.length);
    } else if (event.key === "Enter" && expanded && active >= 0) {
      event.preventDefault(); // pick the option instead of submitting the form
      choose(shown[active]);
    } else if (event.key === "Escape" && expanded) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`${inputClass} ${options.length ? "pr-11" : ""}`}
        />
        {options.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onMouseDown={(event) => {
              event.preventDefault(); // keep focus in the input
              document.getElementById(id)?.focus();
              setOpen((current) => !current);
            }}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground"
          >
            <ChevronDown className={`size-4 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          hidden={!expanded}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-border bg-background py-1 shadow-[0_8px_24px_rgb(10_11_13/0.12)]"
        >
          {shown.map((option, index) => {
            const selected = option.toLowerCase() === query;
            return (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => {
                  event.preventDefault(); // keep focus so blur doesn't close the list first
                  choose(option);
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer px-4 py-2.5 text-[15px] ${index === active ? "bg-surface" : ""} ${
                  selected ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                {option}
              </li>
            );
          })}
        </ul>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-sale">
          {error}
        </p>
      )}
    </div>
  );
}
