import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/page-banner";
import { WishlistView } from "@/components/account-views";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account", href: "/account" }, { label: "Wishlist" }]} />
        <WishlistView />
      </div>
    </div>
  );
}
