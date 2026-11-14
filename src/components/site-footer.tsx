"use client";

import Link from "next/link";
import { ChevronUp, Mail, MapPin, Phone, ShieldCheck, Warehouse } from "lucide-react";
import { legalNav, mapDirectionsUrl, site, supportNav } from "@/lib/site";
import { LogoLockup } from "@/components/logo";
import { hasSocialLinks, SocialLinks } from "@/components/social-icons";

const linkClass =
  "inline-flex min-h-11 items-center text-[15px] text-nav-muted underline-offset-4 transition-colors duration-150 hover:text-white hover:underline";

const headingClass = "text-[13px] font-bold tracking-[0.14em] text-white uppercase";

export function SiteFooter() {
  return (
    <footer className="on-dark mt-12">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex min-h-12 w-full items-center justify-center gap-2 bg-nav-2 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#2a2f35]"
      >
        <ChevronUp aria-hidden="true" className="size-4" />
        Back to top
      </button>

      <div className="bg-nav">
        <div className="container-page grid gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.3fr]">
          <div>
            <Link href="/" aria-label={`${site.name} home`} className="inline-flex min-h-11 items-center">
              <LogoLockup className="text-[22px]" />
            </Link>
            <p className="mt-4 max-w-xs text-[15px] text-nav-muted">
              Trusted reseller of enterprise IT hardware for businesses, system integrators and data centers.
            </p>
            {hasSocialLinks && (
              <>
                <p className="mt-4 text-[13px] font-bold tracking-[0.14em] text-white uppercase">Follow us</p>
                <SocialLinks className="mt-3" />
              </>
            )}
          </div>

          <nav aria-label="Quick links">
            <h2 className={headingClass}>Quick links</h2>
            <ul className="mt-3">
              {[
                ["Home", "/"],
                ["Shop", "/shop"],
                ["Deals", "/deals"],
                ["Brands", "/brands"],
                ["About Us", "/about-us"],
                ["Contact Us", "/contact-us"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Customer service">
            <h2 className={headingClass}>Customer service</h2>
            <ul className="mt-3">
              {[...supportNav, ...legalNav].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/account/orders" className={linkClass}>
                  Order History
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className={headingClass}>Contact details</h2>
            <ul className="mt-3">
              <li>
                <a href={`mailto:${site.contact.salesEmail}`} className={`${linkClass} gap-3`}>
                  <Mail aria-hidden="true" className="size-4 shrink-0 text-lime" />
                  {site.contact.salesEmail}
                </a>
              </li>
              <li>
                <a href={site.contact.phoneHref} className={`${linkClass} gap-3`}>
                  <Phone aria-hidden="true" className="size-4 shrink-0 text-lime" />
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a href={mapDirectionsUrl()} target="_blank" rel="noopener noreferrer" className={`${linkClass} items-start gap-3 py-2.5`}>
                  <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lime" />
                  <span>
                    {site.contact.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    <span className="sr-only"> (opens directions in a new tab)</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={mapDirectionsUrl(site.warehouse.mapQuery)} target="_blank" rel="noopener noreferrer" className={`${linkClass} items-start gap-3 py-2.5`}>
                  <Warehouse aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lime" />
                  <span>
                    <span className="block font-semibold">Warehouse</span>
                    {site.warehouse.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    <span className="sr-only"> (opens directions in a new tab)</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-nav-deep">
        <div className="container-page flex flex-col items-center gap-2 py-5 text-center text-[13px] text-nav-muted sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {site.copyrightYear} {site.legalName}. Registered in Florida, USA. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-4 text-lime" />
            Secure checkout · Prices in USD
          </p>
        </div>
      </div>
    </footer>
  );
}
