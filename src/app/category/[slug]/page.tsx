import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingHeader } from "@/components/listing-header";
import { ProductListing } from "@/components/product-listing";
import { categories, getCategory, lowestPrice, productsInCategory } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: category.description, alternates: { canonical: `/category/${slug}` } };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const list = productsInCategory(category.slug);

  return (
    <div className="container-page pt-2 pb-10">
      <ListingHeader
        crumbs={[{ label: "Shop", href: "/shop" }, { label: category.short }]}
        title={category.name}
        description={category.description}
        image={category.image}
        stat={list.length ? `${list.length} products from ${formatPrice(lowestPrice(list))}` : undefined}
        chips={{ base: `/category/${category.slug}`, items: category.children }}
      />
      <div className="mt-6">
        <ProductListing products={list} />
      </div>
    </div>
  );
}
