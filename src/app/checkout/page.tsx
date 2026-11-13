import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { CheckoutView } from "@/components/checkout-view";
import { Breadcrumbs } from "@/components/page-banner";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="mb-4 flex items-center gap-2.5 text-[26px] font-bold text-foreground sm:text-[30px]">
          <Lock aria-hidden="true" className="size-6 text-primary" />
          Secure checkout
        </h1>
        <CheckoutView />
      </div>
    </div>
  );
}
