import type { Metadata } from "next";
import { ArrowUpRight, ChevronDown, Headset, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { faqs } from "@/content/support";
import { PageBanner } from "@/components/page-banner";
import { mapDirectionsUrl, mapEmbedUrl, site } from "@/lib/site";
import { eyebrowClass } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Phone, email, address and directions for STN IT Enterprise in St. Petersburg, Florida.",
};

/* FAQs are shared with the Support > FAQs page (src/content/support.ts). */

const cardClass =
  "group flex items-start gap-4 rounded-2xl border border-border p-5 transition-[box-shadow,translate,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lift";

const iconWell =
  "grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white";

export default function ContactPage() {
  return (
    <>
      <PageBanner
        title="Contact Us"
        description="Questions about a product, an order or a quote? We're here to help."
        crumbs={[{ label: "Contact Us" }]}
      />

      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          {/* Contact details */}
          <section aria-labelledby="store-title" className="reveal">
            <p className={eyebrowClass}>Our store</p>
            <h2 id="store-title" className="mt-2 text-[28px] leading-tight font-bold text-foreground sm:text-4xl">
              Get in touch
            </h2>
            <ul className="mt-6 grid gap-3">
              <li>
                <a href={site.contact.phoneHref} className={cardClass}>
                  <span className={iconWell}>
                    <Phone aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">Phone</span>
                    <span className="block text-lg font-semibold text-foreground">
                      {site.contact.phone}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.salesEmail}`} className={cardClass}>
                  <span className={iconWell}>
                    <Mail aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-muted-foreground">Sales</span>
                    <span className="block text-lg font-semibold break-all text-foreground">
                      {site.contact.salesEmail}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${site.contact.supportEmail}`} className={cardClass}>
                  <span className={iconWell}>
                    <Headset aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-muted-foreground">Support</span>
                    <span className="block text-lg font-semibold break-all text-foreground">
                      {site.contact.supportEmail}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={mapDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClass}
                >
                  <span className={iconWell}>
                    <MapPin aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">Address</span>
                    <span className="block text-lg font-semibold text-foreground">
                      {site.contact.addressLines[0]}
                    </span>
                    <span className="block text-lg font-semibold text-foreground">
                      {site.contact.addressLines[1]}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Get directions
                      <ArrowUpRight aria-hidden="true" className="size-4" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </span>
                  </span>
                </a>
              </li>
            </ul>
          </section>

          {/* Message form */}
          <section
            aria-labelledby="message-title"
            className="reveal rounded-3xl bg-surface p-6 sm:p-9"
          >
            <p className={eyebrowClass}>Send a message</p>
            <h2 id="message-title" className="mt-2 mb-6 text-[28px] leading-tight font-bold text-foreground sm:text-4xl">
              Contact us for any questions
            </h2>
            <ContactForm />
          </section>
        </div>

        {/* Map */}
        <section aria-labelledby="location-title" className="reveal mt-14 lg:mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={eyebrowClass}>Find us</p>
              <h2 id="location-title" className="mt-2 text-[28px] leading-tight font-bold text-foreground sm:text-4xl">
                Our location
              </h2>
            </div>
            <p className="text-muted-foreground">{site.contact.addressLines.join(", ")}</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <iframe
              title={`Map showing ${site.name} at ${site.contact.addressLines.join(", ")}`}
              src={mapEmbedUrl()}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-[380px] w-full border-0 lg:h-[460px]"
            />
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="mx-auto mt-14 max-w-3xl lg:mt-20">
          <div className="reveal text-center">
            <p className={eyebrowClass}>Information</p>
            <h2 id="faq-title" className="mt-2 text-[28px] leading-tight font-bold text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details key={faq.question} className="group reveal">
                <summary className="flex min-h-16 list-none items-center justify-between gap-4 py-3 text-lg font-semibold text-foreground transition-colors duration-200 hover:text-primary [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <p className="animate-fade-up pb-5 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
