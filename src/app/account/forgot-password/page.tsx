import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account-views";
import { Breadcrumbs } from "@/components/page-banner";
import { cardClass } from "@/lib/ui";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account", href: "/account" }, { label: "Forgot password" }]} />
        <section className={`${cardClass} mx-auto mt-2 max-w-md sm:p-8`} aria-labelledby="forgot-title">
          <h1 id="forgot-title" className="text-[26px] font-bold text-foreground">
            Forgot your password?
          </h1>
          <p className="mt-1 text-muted-foreground">Enter your account email and we&apos;ll send you a link to choose a new one.</p>
          <ForgotPasswordForm />
        </section>
      </div>
    </div>
  );
}
