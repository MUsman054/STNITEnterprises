import Link from "next/link";
import type { Category } from "@/lib/catalog";
import { ProductImage } from "@/components/product-image";

/** Round category shortcuts with a label underneath. */
export function CategoryCircles({ categories, className = "" }: { categories: Category[]; className?: string }) {
  return (
    <ul className={`scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:gap-3 ${className}`}>
      {categories.map((category) => (
        <li key={category.slug} className="w-[92px] shrink-0 sm:w-[118px]">
          <Link href={`/category/${category.slug}`} className="group flex flex-col items-center gap-2 rounded-xl p-1 text-center">
            <span className="relative block size-[80px] overflow-hidden rounded-full bg-surface ring-2 ring-transparent transition-[box-shadow,background-color] duration-300 group-hover:bg-primary-soft group-hover:ring-brand sm:size-[104px]">
              <span className="absolute inset-[12%]">
                <ProductImage image={category.image} alt="" sizes="104px" className="size-full" />
              </span>
            </span>
            <span className="text-[13px] leading-tight font-semibold text-foreground group-hover:text-primary group-hover:underline sm:text-[14px]">
              {category.short}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
