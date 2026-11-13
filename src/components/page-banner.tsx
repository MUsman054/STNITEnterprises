import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const link =
    "inline-flex min-h-11 items-center text-[13px] text-muted-foreground transition-colors duration-150 hover:text-primary hover:underline underline-offset-4";
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1">
        <li>
          <Link href="/" className={link}>
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.label} className="flex items-center gap-x-1">
            <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
            {crumb.href ? (
              <Link href={crumb.href} className={link}>
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 text-[13px] font-medium text-foreground">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Compact page header: breadcrumbs, title and an optional description. */
export function PageBanner({
  title,
  description,
  crumbs,
  children,
}: {
  title: string;
  description?: string;
  crumbs: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border bg-background">
      <div className="container-page pt-2 pb-6">
        <Breadcrumbs crumbs={crumbs} />
        <h1 className="animate-fade-up mt-1 text-[28px] leading-tight font-bold text-foreground sm:text-[34px]">
          {title}
        </h1>
        {description && <p className="animate-fade-up mt-2 max-w-3xl text-muted-foreground">{description}</p>}
        {children}
      </div>
    </div>
  );
}
