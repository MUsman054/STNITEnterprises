import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";
import { PageBanner } from "@/components/page-banner";
import { faqs, supportPages } from "@/content/support";
import { legalNav, site, supportNav } from "@/lib/site";

export function generateStaticParams() {
  return Object.keys(supportPages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/support/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = supportPages[slug];
  return { title: page ? page.title : "Page not found", alternates: { canonical: `/support/${slug}` } };
}

export default async function SupportPage({ params }: PageProps<"/support/[slug]">) {
  const { slug } = await params;
  const page = supportPages[slug];
  if (!page) notFound();

  const sideNav = [...supportNav, ...legalNav];

  return (
    <>
      <PageBanner title={page.title} description={page.intro} crumbs={[{ label: "Support", href: "/support/faqs" }, { label: page.title }]} />

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[250px_1fr] lg:gap-14 lg:py-14">
        <nav aria-label="Support pages" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          {/* Phones: pills wrap so every page (and the current one) stays visible. */}
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
            {sideNav.map((item) => {
              const active = item.href === `/support/${slug}`;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap lg:text-[15px] transition-colors duration-200 lg:rounded-xl ${
                      active ? "bg-nav text-white" : "bg-surface text-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <article className="animate-fade-up max-w-3xl min-w-0">
          {page.notice && (
            <p className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-text/30 bg-amber-50 p-4 text-[15px] text-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-text" />
              {page.notice}
            </p>
          )}

          {slug === "faqs" && (
            <div className="divide-y divide-border border-y border-border">
              {faqs.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex min-h-16 list-none items-center justify-between gap-4 py-3 text-lg font-semibold text-foreground transition-colors duration-200 hover:text-primary [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="animate-fade-up pb-5 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          )}

          {page.blocks.map((block, index) => {
            switch (block.type) {
              case "h2":
                return (
                  <h2 key={index} className="mt-9 text-xl font-bold text-foreground first:mt-0">
                    {block.text}
                  </h2>
                );
              case "h3":
                return (
                  <h3 key={index} className="mt-6 text-lg font-semibold text-foreground first:mt-0">
                    {block.text}
                  </h3>
                );
              case "ul":
                return (
                  <ul key={index} className="mt-3 list-disc space-y-2 pl-6 text-foreground/85 marker:text-brand">
                    {block.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                );
              case "ol":
                return (
                  <ol key={index} className="mt-3 list-decimal space-y-2 pl-6 text-foreground/85 marker:font-semibold marker:text-primary">
                    {block.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                );
              default:
                return (
                  <p key={index} className="mt-3 text-foreground/85 first:mt-0">
                    {block.text}
                  </p>
                );
            }
          })}

          <p className="mt-12 rounded-2xl bg-surface p-5 text-[15px] text-foreground">
            Still have questions? Email{" "}
            <a href={`mailto:${site.contact.salesEmail}`} className="font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4">
              {site.contact.salesEmail}
            </a>{" "}
            or call{" "}
            <a href={site.contact.phoneHref} className="font-semibold text-primary underline decoration-brand decoration-2 underline-offset-4">
              {site.contact.phone}
            </a>
            .
          </p>
        </article>
      </div>
    </>
  );
}
