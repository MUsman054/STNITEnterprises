import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Shopping cart",
};

export default function CartPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page py-5 lg:py-6">
        <CartView />
      </div>
    </div>
  );
}
