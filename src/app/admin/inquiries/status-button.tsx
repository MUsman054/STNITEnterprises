"use client";

import { useTransition } from "react";
import { adminSetInquiryStatus } from "@/actions/admin";

export function InquiryStatusButton({ id, status }: { id: string; status: "new" | "handled" }) {
  const [pending, startTransition] = useTransition();
  const next = status === "new" ? "handled" : "new";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await adminSetInquiryStatus({ id, status: next })))}
      className="min-h-10 rounded-full border border-border px-3 text-[13px] font-semibold whitespace-nowrap hover:bg-surface disabled:opacity-60"
    >
      {status === "new" ? "Mark handled" : "Handled ✓ (undo)"}
    </button>
  );
}
