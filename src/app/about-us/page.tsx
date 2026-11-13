import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, Eye, Target } from "lucide-react";
import { PageBanner } from "@/components/page-banner";
import { btnOutline, btnPrimary, eyebrowClass } from "@/lib/ui";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "STN IT Enterprise is a trusted IT hardware reseller specializing in enterprise-grade technology solutions.",
};

/* Copy on this page is taken from the client's current About Us page. */

const supply = [
  "Servers (new and refurbished)",
  "Server parts (CPUs, RAM, power supplies, storage drives)",
  "Networking equipment (switches, routers, access points)",
  "Storage solutions (NAS, SAN, RAID arrays)",
  "IT accessories and peripherals",
];

const activities = [
  "Resale and distribution of IT hardware and components",
  "B2B supply of servers, networking equipment, and storage systems",
  "Procurement and sourcing for corporate IT infrastructure",
  "Inventory fulfillment and logistics for system integrators and resellers",
];

export default function AboutPage() {
  return (
    <>
      <PageBanner title="About Us" crumbs={[{ label: "About Us" }]} />

      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="reveal">
            <p className={eyebrowClass}>Who we are</p>
            <h2 className="mt-2 text-[28px] leading-tight font-bold text-foreground sm:text-4xl">
              A trusted reseller of enterprise IT hardware
            </h2>
            <div className="mt-5 space-y-4 text-lg text-muted-foreground">
              <p>
                STN IT ENTERPRISE is a trusted and dynamic IT hardware reseller specializing in
                enterprise-grade technology solutions. Established with a vision to provide reliable
                and high-performance hardware products, we supply a wide range of IT infrastructure
                components to businesses, system integrators, and data centers worldwide.
              </p>
              <p>
                Our team comprises experienced IT procurement professionals who ensure that every
                product we offer meets industry standards and client requirements. We partner with
                certified distributors and manufacturers to maintain authenticity, warranty
                assurance, and consistent inventory.
              </p>
              <p>
                We are committed to delivering exceptional service, fast turnaround times, and
                competitive pricing. We serve both local and international markets, providing
                tailored solutions for clients ranging from SMEs to large-scale enterprises.
              </p>
            </div>
          </div>

          <div className="reveal rounded-3xl bg-surface p-7 sm:p-9">
            <h2 className="text-xl font-semibold text-foreground">What we source and distribute</h2>
            <ul className="mt-5 space-y-3.5">
              {supply.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 lg:mt-20">
          {[
            {
              icon: Target,
              title: "Our Mission",
              body: "To empower businesses with reliable IT infrastructure by delivering trusted hardware solutions and unparalleled customer support.",
            },
            {
              icon: Eye,
              title: "Our Vision",
              body: "To be a leading global reseller of enterprise IT hardware and components, known for integrity, efficiency, and excellence.",
            },
            {
              icon: Building2,
              title: "Legal Status",
              body: "STN IT ENTERPRISE is officially registered as a Limited Liability Company (LLC) in the State of Florida, United States, in 2025, and is fully compliant with all applicable state and federal regulations.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="reveal">
              <div className="group h-full rounded-3xl border border-border p-7 transition-[box-shadow,translate,border-color] duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  <Icon aria-hidden="true" className="size-[22px]" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="reveal mt-14 rounded-3xl bg-primary-soft p-7 sm:p-10 lg:mt-20">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Core business activities</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {activities.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground">
                <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-lg text-foreground">
            We are committed to establishing lasting partnerships with our clients by consistently delivering value, transparency, and
            performance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className={btnPrimary}>
              Browse the shop
            </Link>
            <Link href="/contact-us" className={btnOutline}>
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
