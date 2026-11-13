import type { Metadata } from "next";
import { OrderConfirmationView } from "@/components/order-confirmation-view";

export const metadata: Metadata = {
  title: "Order received",
};

export default function OrderConfirmationPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page py-8 lg:py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-background p-5 shadow-card sm:p-8">
          <OrderConfirmationView />
        </div>
      </div>
    </div>
  );
}
