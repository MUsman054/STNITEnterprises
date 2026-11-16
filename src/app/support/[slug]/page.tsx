import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  Lock,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs } from "@/components/page-banner";
import { faqs, supportPages, type Block } from "@/content/support";
import { legalNav, site, supportNav } from "@/lib/site";

const navIcons: Record<string, LucideIcon> = {
  "/support/faqs": CircleHelp,
  "/support/return-policy": RotateCcw,
  "/support/warranty": ShieldCheck,
  "/support/shipping-policy": Truck,
  "/support/terms-conditions": FileText,
  "/support/privacy-policy": Lock,
};

/**
 * Pages that end with the "Still need help?" contact card: the ones that send the reader
 * to us. Return and Shipping already end with their own contact section; legal pages don't need it.
 */
const contactCardPages = new Set(["faqs", "warranty"]);

type Section ={ id: string; heading?: string; blocks: Block[] };

/** Splits the flat block list into one section per h2. */
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

const textLink = "font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary";

/** Email addresses, our phone number and web addresses inside the policy text. */
const linkPattern = new RegExp(
  `(${site.contact.phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+|https?://[^\\s),]*[^\\s),.])`,
  "g",
);

/** Policy text with its contact details made tappable. The phone number never breaks across lines. */
function rich(text: string) {
  return text.split(linkPattern).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part === site.contact.phone) {
      return (
        <a key={i} href={site.contact.phoneHref} className={`${textLink} whitespace-nowrap`}>
          {part}
        </a>
      );
    }
    if (part.startsWith("http")) {
      return (
        <a key={i} href={part} className={`${textLink} break-words`}>
          {part.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      );
    }
    return (
      <a key={i} href={`mailto:${part}`} className={`${textLink} break-words`}>
        {part}
      </a>
    );
  });
}

/** "Identifiers: Name, email…" reads as a term and its description, so the term is set in bold. */
function listItem(text: string) {
  const label = /^([A-Z][A-Za-z/& -]{1,28}):\s+(.+)$/.exec(text);
  if (!label) return rich(text);
  return (
    <>
      <strong className="font-semibold text-foreground">{label[1]}:</strong> {rich(label[2])}
    </>
  );
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "h2":
      return null;
    case "h3":
      return (
        <h3 key={index} className="mt-7 text-[17px] leading-snug font-semibold text-foreground first:mt-0 lg:text-lg">
          {block.text}
        </h3>
      );
    case "ul":
      // A single point is a sentence, not a list.
      if (block.items.length === 1) {
        return (
          <p key={index} className="mt-3 first:mt-0">
            {listItem(block.items[0])}
          </p>
        );
      }
      return (
        <ul key={index} className="mt-3 space-y-2.5 first:mt-0">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="min-w-0">{listItem(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      // Steps: numbered markers joined by a line, so a process reads as one sequence.
      return (
        <ol key={index} className="mt-5 first:mt-0">
          {block.items.map((item, i) => (
            <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
              {i < block.items.length - 1 && (
                <span aria-hidden="true" className="absolute top-8 bottom-0 left-[13px] w-px bg-border" />
              )}
              <span
                aria-hidden="true"
                className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white tabular-nums"
              >
                {i + 1}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="sr-only">Step {i + 1}: </span>
                {rich(item)}
              </span>
            </li>
          ))}
        </ol>
      );
    default:
      return (
        <p key={index} className="mt-3 first:mt-0">
          {rich(block.text)}
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
  const eyebrow = legalNav.some((item) => item.href === current) ? "Legal" : "Customer support";
  const sections = toSections(page.blocks);
  const toc = sections.filter((section) => section.heading);

  return (
    <>
      {/* Header: what this page is, then every support topic one tap away. */}
      <header className="border-b border-border bg-surface">
        <div className="container-page pt-2 pb-6 lg:pb-10">
          <Breadcrumbs crumbs={[{ label: "Support", href: "/support/faqs" }, { label: page.title }]} />

          <div className="animate-fade-up mt-3 flex items-start gap-4 lg:mt-5">
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary sm:flex">
              <CurrentIcon aria-hidden="true" className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>
              <h1 className="mt-1.5 text-[28px] leading-[1.15] font-bold text-foreground sm:text-[34px] lg:text-[40px]">{page.title}</h1>
              {page.intro && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-[17px]">{page.intro}</p>}
            </div>
          </div>

          {/* Phones and tablets: all topics as a compact grid. Desktop uses the side list. */}
          <nav aria-label="Support topics" className="mt-6 lg:hidden">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sideNav.map((item) => {
                const active = item.href === current;
                const Icon = navIcons[item.href] ?? FileText;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-full min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2 text-sm leading-tight font-semibold transition-colors duration-200 ${
                        active
                          ? "border-nav bg-nav text-white"
                          : "border-border bg-background text-foreground active:border-primary active:bg-primary-soft"
                      }`}
                    >
                      <Icon aria-hidden="true" className={`size-[18px] shrink-0 ${active ? "text-lime" : "text-primary"}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <div className="container-page grid py-8 lg:grid-cols-[250px_1fr] lg:gap-14 lg:py-14">
        {/* Desktop: sticky side list. */}
        <nav aria-label="Support pages" className="hidden min-w-0 lg:sticky lg:top-28 lg:block lg:self-start">
          <ul className="flex flex-col gap-1">
            {sideNav.map((item) => {
              const active = item.href === current;
              const Icon = navIcons[item.href] ?? FileText;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-4 text-[15px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                      active ? "bg-nav text-white" : "text-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    <Icon aria-hidden="true" className={`size-[18px] shrink-0 ${active ? "text-lime" : "text-muted-foreground"}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <article className="animate-fade-up max-w-3xl min-w-0">
          {page.notice && (
            <p className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-text/25 bg-amber-50 p-4 text-[15px] leading-relaxed text-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-text" />
              {page.notice}
            </p>
          )}

          {slug === "faqs" && (
            <div className="divide-y divide-border border-y border-border">
              {faqs.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex min-h-16 list-none items-center justify-between gap-4 py-4 text-base leading-snug font-semibold text-foreground transition-colors duration-200 group-open:text-primary hover:text-primary lg:text-lg [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-foreground transition-[rotate,background-color,color] duration-300 group-open:rotate-45 group-open:bg-primary group-open:text-white">
                      <Plus aria-hidden="true" className="size-4" />
                    </span>
                  </summary>
                  <p className="animate-fade-up pr-12 pb-5 text-base leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          )}

          {/* One continuous document: sections are divided by hairlines, not boxed. */}
          <div className="divide-y divide-border">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={section.heading ? `${section.id}-title` : undefined}
                className="py-7 text-base leading-[1.7] text-pretty text-foreground/80 first:pt-0 last:pb-0 lg:py-9"
              >
                {section.heading && (
                  <h2 id={`${section.id}-title`} className="mb-4 text-xl leading-snug font-bold text-foreground lg:text-2xl">
                    {toc.length > 1 && (
                      <span aria-hidden="true" className="mb-1.5 block font-mono text-[13px] font-semibold tracking-wider text-primary">
                        {String(toc.indexOf(section) + 1).padStart(2, "0")}
                      </span>
                    )}
                    {section.heading}
                  </h2>
                )}
                {section.blocks.map(renderBlock)}
              </section>
            ))}
          </div>

          {/* Contact: big tap targets on phones. */}
          {contactCardPages.has(slug) && (
          <aside aria-labelledby="support-help-title" className="on-dark mt-10 rounded-2xl bg-nav p-5 text-white sm:p-7 lg:mt-12">
            <p className="text-xs font-semibold tracking-[0.14em] text-lime uppercase">Contact</p>
            <h2 id="support-help-title" className="mt-1.5 text-xl font-bold lg:text-2xl">
              Still need help?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-nav-muted">Our team is happy to answer questions about orders, returns and parts.</p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <a
                href={site.contact.phoneHref}
                className="flex min-h-14 items-center gap-3 rounded-xl bg-lime px-4 py-2 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
              >
                <Phone aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-medium">Call us</span>
                  <span className="block text-base">{site.contact.phone}</span>
                </span>
              </a>
              <a
                href={`mailto:${site.contact.salesEmail}`}
                className="flex min-h-14 items-center gap-3 rounded-xl bg-nav-2 px-4 py-2 font-semibold text-white ring-1 ring-white/15 transition-colors duration-200 hover:bg-white/10"
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
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-lime underline-offset-4 hover:underline"
            >
              <MessageSquareText aria-hidden="true" className="size-[18px]" />
              Send us a message
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </aside>
          )}
        </article>
      </div>
    </>
  );
}
