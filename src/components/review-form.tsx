"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleCheck, Star } from "lucide-react";
import { deleteMyReview, submitReview } from "@/actions/reviews";
import { btnOutline, btnPrimary, inputClass, labelClass } from "@/lib/ui";

type Existing = { rating: number; title: string | null; body: string; hidden: boolean } | null;
type Errors = Partial<Record<"rating" | "title" | "body", string>>;

const ratingWords = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Write or edit the signed-in customer's review of one product. */
export function ReviewForm({ slug, existing }: { slug: string; existing: Existing }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState<"" | "created" | "updated" | "deleted">("");
  const [editing, setEditing] = useState(!existing);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    if (!rating) found.rating = "Choose a star rating.";
    if (body.trim().length < 20) found.body = "Tell other buyers a little more (at least 20 characters).";
    setErrors(found);
    if (found.rating) return document.getElementById("review-star-1")?.focus();
    if (found.body) return document.getElementById("review-body")?.focus();

    setFormError("");
    startTransition(async () => {
      const result = await submitReview({ slug, rating, title, body });
      if (!result.ok) {
        setErrors((result.fieldErrors ?? {}) as Errors);
        setFormError(result.error ?? (result.fieldErrors ? "" : "Your review couldn't be saved. Please try again."));
        return;
      }
      setDone(result.updated ? "updated" : "created");
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Delete your review? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteMyReview({ slug });
      if (!result.ok) return setFormError(result.error ?? "Your review couldn't be deleted.");
      setDone("deleted");
      setRating(0);
      setTitle("");
      setBody("");
      setEditing(true);
      router.refresh();
    });
  }

  const message =
    done === "created"
      ? "Thanks! Your review is now live."
      : done === "updated"
        ? "Your review was updated."
        : done === "deleted"
          ? "Your review was deleted."
          : "";

  if (!editing) {
    return (
      <div className="space-y-3">
        {message && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-primary-soft p-4 font-semibold text-primary">
            <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
            {message}
          </p>
        )}
        {existing?.hidden && (
          <p className="rounded-xl border border-amber-text/40 bg-surface p-4 text-[14px] text-foreground">
            Your review isn&apos;t shown on the site at the moment. Contact us if you have questions.
          </p>
        )}
        <p className="text-[15px] text-foreground">You&apos;ve reviewed this item. You can edit or delete your review at any time.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setEditing(true)} className={btnPrimary}>
            Edit your review
          </button>
          {!existing?.hidden && (
            <button type="button" onClick={handleDelete} disabled={pending} className={btnOutline}>
              Delete
            </button>
          )}
        </div>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      {message && (
        <p role="status" className="rounded-xl bg-primary-soft p-4 font-semibold text-primary">
          {message}
        </p>
      )}
      {formError && (
        <p role="alert" className="rounded-xl border border-sale/40 bg-sale/5 p-4 font-semibold text-sale">
          {formError}
        </p>
      )}

      <fieldset>
        <legend className={labelClass}>Overall rating</legend>
        <div className="flex flex-wrap items-center gap-3" onMouseLeave={() => setHover(0)}>
          <div role="radiogroup" aria-label="Rating" aria-invalid={Boolean(errors.rating)} className="flex">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                id={`review-star-${value}`}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}, ${ratingWords[value]}`}
                tabIndex={rating ? (rating === value ? 0 : -1) : value === 1 ? 0 : -1}
                onClick={() => {
                  setRating(value);
                  setErrors((e) => ({ ...e, rating: undefined }));
                }}
                onMouseEnter={() => setHover(value)}
                onKeyDown={(event) => {
                  const next = event.key === "ArrowRight" || event.key === "ArrowUp" ? value + 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? value - 1 : 0;
                  if (next >= 1 && next <= 5) {
                    event.preventDefault();
                    setRating(next);
                    document.getElementById(`review-star-${next}`)?.focus();
                  }
                }}
                className="grid size-11 place-items-center rounded-lg transition-transform duration-150 hover:scale-110"
              >
                <Star aria-hidden="true" className={`size-8 ${value <= shown ? "fill-star text-star" : "fill-transparent text-border"}`} />
              </button>
            ))}
          </div>
          <span className="min-w-20 text-[15px] font-semibold text-foreground" aria-hidden="true">
            {ratingWords[shown]}
          </span>
        </div>
        {errors.rating && <p className="mt-1.5 text-sm font-medium text-sale">{errors.rating}</p>}
      </fieldset>

      <div>
        <label htmlFor="review-title" className={labelClass}>
          Headline <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="review-title"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What's most important to know?"
          className={inputClass}
        />
        {errors.title && <p className="mt-1.5 text-sm font-medium text-sale">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="review-body" className={labelClass}>
          Your review
        </label>
        <textarea
          id="review-body"
          rows={5}
          maxLength={3000}
          value={body}
          aria-invalid={Boolean(errors.body)}
          aria-describedby="review-body-hint"
          onChange={(event) => {
            setBody(event.target.value);
            if (errors.body) setErrors((e) => ({ ...e, body: undefined }));
          }}
          placeholder="How did the part perform? Was it as described, and did it arrive well packed?"
          className={`${inputClass} py-3`}
        />
        <p id="review-body-hint" className="mt-1.5 flex justify-between gap-3 text-[13px] text-muted-foreground">
          <span className={errors.body ? "font-medium text-sale" : ""}>{errors.body ?? "At least 20 characters."}</span>
          <span className="tabular-nums">{body.length}/3000</span>
        </p>
      </div>

      <p className="text-[13px] text-muted-foreground">Your first name and last initial are shown with your review. Your email is never shown.</p>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : existing ? "Update review" : "Submit review"}
        </button>
        {existing && (
          <button type="button" onClick={() => setEditing(false)} className={btnOutline}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
