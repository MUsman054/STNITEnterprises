"use client";

import { useState, useTransition } from "react";
import { adminModerateReview, adminReplyToReview } from "@/actions/reviews";

const button = "min-h-10 rounded-full border border-border px-3 text-[13px] font-semibold whitespace-nowrap hover:bg-surface disabled:opacity-60";

export function ReviewModeration({ id, status }: { id: string; status: "published" | "hidden" }) {
  const [pending, startTransition] = useTransition();
  const run = (action: "publish" | "hide" | "delete") => startTransition(async () => void (await adminModerateReview({ id, action })));
  return (
    <div className="flex flex-col items-start gap-2">
      <span className={`text-[13px] font-semibold ${status === "hidden" ? "text-sale" : "text-primary"}`}>{status === "hidden" ? "Hidden" : "Published"}</span>
      <button type="button" disabled={pending} onClick={() => run(status === "hidden" ? "publish" : "hide")} className={button}>
        {status === "hidden" ? "Show on site" : "Hide"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Delete this review permanently? The customer will be able to write a new one.")) run("delete");
        }}
        className={`${button} text-sale`}
      >
        Delete
      </button>
    </div>
  );
}

/** The store's public response under a review: add, edit or remove it. */
export function ReviewReply({ id, reply }: { id: string; reply: string | null }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reply ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = (value: string) =>
    startTransition(async () => {
      const result = await adminReplyToReview({ id, reply: value });
      if (!result.ok) return setError(result.fieldErrors?.reply ?? result.error ?? "Couldn't save the reply.");
      setError("");
      setOpen(false);
    });

  if (!open) {
    return (
      <div className="mt-3">
        {reply && (
          <p className="mb-2 rounded-lg border-l-4 border-primary bg-surface px-3 py-2 text-[13px] whitespace-pre-wrap">
            <span className="block font-semibold">Your reply</span>
            {reply}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setText(reply ?? "");
            setOpen(true);
          }}
          className={button}
        >
          {reply ? "Edit reply" : "Reply publicly"}
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-3 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return setError("Write a reply, or use Remove reply.");
        save(text);
      }}
    >
      <label htmlFor={`reply-${id}`} className="text-[13px] font-semibold">
        Public reply (shown under the review)
      </label>
      <textarea
        id={`reply-${id}`}
        rows={4}
        maxLength={2000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="w-full rounded-lg border border-foreground/25 bg-background p-2 text-[14px]"
      />
      {error && <p className="text-[13px] font-medium text-sale">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={`${button} bg-primary text-white hover:bg-primary-hover`}>
          {pending ? "Saving…" : "Save reply"}
        </button>
        {reply && (
          <button type="button" disabled={pending} onClick={() => window.confirm("Remove your reply?") && save("")} className={`${button} text-sale`}>
            Remove reply
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => setOpen(false)} className={button}>
          Cancel
        </button>
      </div>
    </form>
  );
}
