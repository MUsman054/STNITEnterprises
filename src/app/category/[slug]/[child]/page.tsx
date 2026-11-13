import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingHeader } from "@/components/listing-header";
import { ProductListing } from "@/components/product-listing";
import { categories, getCategory, getChild, lowestPrice, productsInChild } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";

export function generateStaticParams() {
  return categories.flatMap((category) => category.children.map((child) => ({ slug: category.slug, child: child.slug })));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]/[child]">): Promise<Metadata> {
  const { slug, child } = await params;
  const category = getCategory(slug);
  const sub = getChild(slug, child);
  if (!category || !sub) return { title: "Category not found" };
  return {
    title: `${sub.name} | ${category.short}`,
    description: `Shop ${sub.name.toLowerCase()} in ${category.name}: ${category.description}`,
    alternates: { canonical: `/category/${slug}/${child}` },
  };
}

export default async function ChildCategoryPage({ params }: PageProps<"/category/[slug]/[child]">) {
  const { slug, child } = await params;
  const category = getCategory(slug);
  const sub = getChild(slug, child);
  if (!category || !sub) notFound();
  const list = productsInChild(category.slug, sub.slug);

  return (
    <div className="container-page pt-2 pb-10">
      <ListingHeader
        crumbs={[
          { label: "Shop", href: "/shop" },
          { label: category.short, href: `/category/${category.slug}` },
          { label: sub.name },
        ]}
        title={sub.name}
        description={category.description}
        image={list[0]?.image ?? category.image}
        stat={list.length ? `${list.length} products from ${formatPrice(lowestPrice(list))}` : undefined}
        chips={{ base: `/category/${category.slug}`, items: category.children }}
        activeChip={sub.slug}
      />
      <div className="mt-6">
        <ProductListing products={list} showGroups={false} />
      </div>
    </div>
  );
}
