import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import {
  BrandCarousel,
  DealsOfTheWeek,
  FeaturedCategories,
  QuoteBand,
  Testimonials,
  WhyShopWithUs,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="bg-canvas">
        <div className="container-page space-y-10 py-8 lg:space-y-14 lg:py-12">
          <FeaturedCategories />
          <FeaturedProducts />
          <BrandCarousel />
          <DealsOfTheWeek />
          <WhyShopWithUs />
          <Testimonials />
          <QuoteBand />
          <Newsletter />
        </div>
      </div>
    </>
  );
}
