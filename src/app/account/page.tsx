import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/page-banner";
import { AuthView } from "@/components/account-views";

export const metadata: Metadata = { title: "Login / Signup" };

export default function AccountPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page pt-2 pb-10">
        <Breadcrumbs crumbs={[{ label: "My Account" }]} />
        <AuthView />
      </div>
    </div>
  );
}
