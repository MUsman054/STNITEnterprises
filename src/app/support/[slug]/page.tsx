import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  FileText,
  Info,
  List,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PageBanner } from "@/components/page-banner";
import { faqs, supportPages, type Block, type Highlight } from "@/content/support";
import { legalNav, site, supportNav } from "@/lib/site";

const navIcons: Record<string, LucideIcon> = {
  "/support/faqs": CircleHelp,
  "/support/return-policy": RotateCcw,
  "/support/warranty": ShieldCheck,
  "/support/shipping-policy": Truck,
  "/support/terms-conditions": FileText,
  "/support/privacy-policy": Lock,
};

const highlightIcons: Record<Highlight["icon"], LucideIcon> = {
  clock: Clock,
  map: MapPin,
  mail: Mail,
  rma: PackageCheck,
  report: CalendarClock,
  refund: Wallet,
};

type Section = { id: string; heading?: string; blocks: Block[] };

/** Splits the flat block list into one section per h2, so each can be its own card. */
function toSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
  const used = new Set<string>();
  for (const block of blocks) {
    if (block.type === "h2") {
      let id = block.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
      while (used.has(id)) id += "-2";
      used.add(id);
      sections.push({ id, heading: block.text, blocks: [] });
    } else {
      if (sections.length === 0) sections.push({ id: "overview", blocks: [] });
      sections[sections.length - 1].blocks.push(block);
    }
  }
  return sections;
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "h2":
      return null;
    case "h3":
      return (
        <h3 key={index} className="mt-5 text-base font-semibold text-foreground first:mt-0 lg:text-lg">
          {block.text}
        </h3>
      );
    case "ul":
      return (
        <ul key={index} className="mt-3 list-disc space-y-2 pl-5 marker:text-brand first:mt-0">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={index} className="mt-3 space-y-3 first:mt-0">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-primary"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="sr-only">Step {i + 1}: </span>
                {item}
              </span>
            </li>
          ))}
        </ol>
      );
    default:
      return (
        <p key={index} className="mt-3 first:mt-0">
          {block.text}
        </p>
      );
  }
}

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
  const current = `/support/${slug}`;
  const CurrentIcon = navIcons[current] ?? FileText;
  const sections = toSections(page.blocks);
  const toc = sections.filter((section) => section.heading);

  // Phones: white cards on a grey page. Desktop keeps the plain reading layout.
  const card = "rounded-2xl border border-border bg-background shadow-card";

  return (
    <>
      <PageBanner title={page.title} description={page.intro} crumbs={[{ label: "Support", href: "/support/faqs" }, { label: page.title }]} />

      <div className="bg-canvas lg:bg-background">
        <div className="container-page grid gap-4 py-4 lg:grid-cols-[250px_1fr] lg:gap-14 lg:py-14">
          {/* Phones and tablets: one compact "topic" menu instead of a row of tabs. */}
          <details key={slug} className={`group/menu min-w-0 lg:hidden ${card}`}>
            <summary className="flex min-h-14 list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <CurrentIcon aria-hidden="true" className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted-foreground">Support topic</span>
                <span className="block truncate text-[15px] font-semibold text-foreground">{page.title}</span>
              </span>
              <span className="text-[13px] font-semibold text-primary group-open/menu:hidden">Change</span>
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-300 group-open/menu:rotate-180" />
            </summary>
            <nav aria-label="Support topics" className="border-t border-border p-2">
              <ul>
                {sideNav.map((item) => {
                  const active = item.href === current;
                  const Icon = navIcons[item.href] ?? FileText;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors duration-200 ${
                          active ? "bg-primary-soft text-primary" : "text-foreground active:bg-surface"
                        }`}
                      >
                        <Icon aria-hidden="true" className={`size-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="flex-1">{item.label}</span>
                        {!active && <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </details>

          {/* Desktop: sticky side list. */}
          <nav aria-label="Support pages" className="hidden min-w-0 lg:sticky lg:top-28 lg:block lg:self-start">
            <ul className="flex flex-col gap-2">
              {sideNav.map((item) => {
                const active = item.href === current;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-xl px-4 text-[15px] font-semibold whitespace-nowrap transition-colors duration-200 ${
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

          <article className="animate-fade-up max-w-3xl min-w-0 space-y-4 lg:space-y-0">
            {page.notice && (
              <p className="flex items-start gap-3 rounded-2xl border border-amber-text/30 bg-amber-50 p-4 text-[15px] text-foreground lg:mb-6">
                <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-text" />
                {page.notice}
              </p>
            )}

            {page.highlights && (
              <dl className={`divide-y divide-border sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:mb-8 ${card}`}>
                {page.highlights.map((item) => {
                  const Icon = highlightIcons[item.icon];
                  return (
                    <div key={item.label} className="flex items-center gap-3 p-4 sm:flex-col sm:items-start sm:gap-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[13px] text-muted-foreground">{item.label}</dt>
                        <dd className="text-[15px] font-semibold text-foreground">{item.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            )}

            {slug === "faqs" && (
              <div className={`divide-y divide-border overflow-hidden lg:rounded-none lg:border-x-0 lg:shadow-none ${card}`}>
                {faqs.map((faq) => (
                  <details key={faq.question} className="group">
                    <summary className="flex min-h-14 list-none items-center justify-between gap-4 px-4 py-3 text-base font-semibold text-foreground transition-colors duration-200 hover:text-primary lg:min-h-16 lg:px-0 lg:text-lg [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="animate-fade-up px-4 pb-4 text-[15px] leading-relaxed text-muted-foreground lg:px-0 lg:pb-5 lg:text-base">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            )}

            {/* Long pages get a jump list so nobody has to scroll to find a section. */}
            {toc.length >= 5 && (
              <details className={`group/toc lg:mb-8 ${card}`}>
                <summary className="flex min-h-12 list-none items-center gap-3 px-4 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <List aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  <span className="flex-1">On this page</span>
                  <span className="text-[13px] font-medium text-muted-foreground">{toc.length} sections</span>
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-300 group-open/toc:rotate-180" />
                </summary>
                <ol className="border-t border-border p-2">
                  {toc.map((section, i) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary"
                      >
                        <span aria-hidden="true" className="w-5 shrink-0 text-[13px] font-semibold text-muted-foreground tabular-nums">
                          {i + 1}
                        </span>
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={section.heading ? `${section.id}-title` : undefined}
                className={`p-4 text-[15px] leading-relaxed text-foreground/85 lg:mt-9 lg:rounded-none lg:border-0 lg:p-0 lg:text-base lg:shadow-none lg:first:mt-0 ${card}`}
              >
                {section.heading && (
                  <h2 id={`${section.id}-title`} className="mb-3 text-lg font-bold text-foreground lg:text-xl">
                    {section.heading}
                  </h2>
                )}
                {section.blocks.map(renderBlock)}
              </section>
            ))}

            {/* Contact: big tap targets on phones. */}
            <aside aria-labelledby="support-help-title" className="on-dark rounded-2xl bg-nav p-5 text-white lg:mt-12 lg:p-6">
              <h2 id="support-help-title" className="text-lg font-bold">
                Still need help?
              </h2>
              <p className="mt-1 text-[15px] text-nav-muted">Our team is happy to answer questions about orders, returns and parts.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a
                  href={site.contact.phoneHref}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-lime px-4 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
                >
                  <Phone aria-hidden="true" className="size-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">Call us</span>
                    <span className="block text-[15px]">{site.contact.phone}</span>
                  </span>
                </a>
                <a
                  href={`mailto:${site.contact.salesEmail}`}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-nav-2 px-4 py-2 font-semibold text-white ring-1 ring-white/15 transition-colors duration-200 hover:bg-white/10"
                >
                  <Mail aria-hidden="true" className="size-5 shrink-0 text-lime" />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-nav-muted">Email us</span>
                    <span className="block text-[15px] break-all">{site.contact.salesEmail}</span>
                  </span>
                </a>
              </div>
              <Link
                href="/contact-us"
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-lime underline-offset-4 hover:underline"
              >
                <MessageSquareText aria-hidden="true" className="size-[18px]" />
                Send us a message
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </aside>
          </article>
        </div>
      </div>
    </>
  );
}
