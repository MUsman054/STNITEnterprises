import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { btnOutline, btnPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <section className="container-page py-20 text-center lg:py-28">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
        <SearchX aria-hidden="true" className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-5xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={btnPrimary}>
          Back to the homepage
        </Link>
        <Link href="/shop" className={btnOutline}>
          Browse the shop
        </Link>
      </div>
    </section>
  );
}
