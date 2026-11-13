"use client";

import { useId, useRef, useState } from "react";

/** Accessible tabs (arrow keys move between tabs, Home/End jump to the ends). */
export function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    setActive(tab.id);
    refs.current[tab.id]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Product information" className="scrollbar-none -mx-3 flex gap-1 overflow-x-auto border-b border-border px-3">
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") focusTab(index + 1);
                if (event.key === "ArrowLeft") focusTab(index - 1);
                if (event.key === "Home") focusTab(0);
                if (event.key === "End") focusTab(tabs.length - 1);
              }}
              className={`relative min-h-12 shrink-0 px-4 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 ${
                selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-brand transition-[opacity,scale] duration-300 ${
                  selected ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="animate-fade-in pt-6"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
