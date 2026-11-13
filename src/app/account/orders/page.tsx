import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/page-banner";
import { OrderHistoryView } from "@/components/account-views";

export const metadata: Metadata = { title: "Order History" };

export default function OrdersPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account", href: "/account" }, { label: "Order History" }]} />
        <OrderHistoryView />
      </div>
    </div>
  );
}
