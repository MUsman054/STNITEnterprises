import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Truck, Wrench } from "lucide-react";
import { SearchBox } from "@/components/search-box";

const popular = ["ST500NM0011", "32GB DDR4", "Xeon Gold", "Catalyst 2960X", "750W PSU"];

const collage = [
  { src: "/images/catalog/server.webp", className: "left-[4%] top-[6%] w-[56%] rotate-[-4deg]" },
  { src: "/images/catalog/xeon.webp", className: "right-[0%] top-[4%] w-[36%] rotate-[6deg]" },
  { src: "/images/catalog/hdd.webp", className: "left-[0%] bottom-[4%] w-[34%] rotate-[3deg]" },
  { src: "/images/catalog/ram.webp", className: "right-[6%] bottom-[0%] w-[44%] rotate-[-3deg]" },
];

/** Hero banner: promo text, part-number search and a collage of product images. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="on-dark relative overflow-hidden bg-hero-dark text-white">

      <div className="container-page relative grid items-center gap-10 py-12 lg:grid-cols-[1.15fr_1fr] lg:py-16">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-semibold text-lime">
            <span className="size-1.5 rounded-full bg-lime" aria-hidden="true" />
            Enterprise IT hardware reseller
          </p>
          <h1 id="hero-title" className="mt-5 font-display text-[34px] leading-[1.08] font-bold sm:text-[46px] lg:text-[54px]">
            Servers, parts and storage, <span className="text-lime">sourced right.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[#c9cfd5]">
            Quality-assured new and refurbished hardware for businesses, system integrators and data centers. Search by part number to find it fast.
          </p>

          {/* Phones already have the search box in the header. */}
          <div className="mt-7 hidden max-w-2xl md:block">
            <SearchBox id="search-hero" />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#c9cfd5]">
            <span>Popular:</span>
            {popular.map((term) => (
              <Link
                key={term}
                href={`/shop?q=${encodeURIComponent(term)}`}
                className="inline-flex min-h-11 items-center rounded-full px-2 font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors duration-150 hover:text-lime hover:decoration-lime"
              >
                {term}
              </Link>
            ))}
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#c9cfd5]">
            <li className="flex items-center gap-2">
              <Truck aria-hidden="true" className="size-4 text-lime" />
              Ships in 2–5 business days
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-lime" />
              Certified sourcing
            </li>
            <li className="flex items-center gap-2">
              <Wrench aria-hidden="true" className="size-4 text-lime" />
              Expert procurement team
            </li>
          </ul>
        </div>

        <div aria-hidden="true" className="relative mx-auto hidden aspect-[1.1] w-full max-w-[560px] md:block">
          {collage.map((item, index) => (
            <div
              key={item.src}
              className={`absolute aspect-square overflow-hidden rounded-3xl bg-white shadow-pop transition-transform duration-500 hover:z-10 hover:scale-105 ${item.className}`}
            >
              <Image src={item.src} alt="" fill priority={index === 0} sizes="320px" className="object-contain p-3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
