import type {
  PublicBranch,
  PublicCarCard,
  PublicCategory,
  PublicStats,
  PublicTestimonial,
} from "@/lib/public-api";
import { AboutTeaser } from "./about-teaser";
import { CategoryChips } from "./category-chips";
import { FaqTeaser } from "./faq-teaser";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import type { HeroCar } from "./pick-hero-car";
import { PopularCars } from "./popular-cars";
import { PromoBanner } from "./promo-banner";
import { Testimonials } from "./testimonials";

export type HomeData = {
  hero: HeroCar;
  branches: PublicBranch[] | null;
  popular: PublicCarCard[] | null;
  categories: PublicCategory[] | null;
  testimonials: PublicTestimonial[] | null;
  stats: PublicStats | null;
};

/** Photo for the about/promo sections: a car photo from the API (no lifestyle photos in the repo). */
function photoOf(hero: HeroCar, popular: PublicCarCard[] | null, index: number) {
  if (hero.kind === "model" && hero.car.photos.length > 0) {
    return hero.car.photos[Math.min(index, hero.car.photos.length - 1)] ?? null;
  }
  return popular?.filter((car) => car.thumbnail !== null)[index]?.thumbnail ?? null;
}

export function HeroSection({ hero, branches }: Pick<HomeData, "hero" | "branches">) {
  return <Hero hero={hero} branches={branches} />;
}

/** Sections after the hero; each one is skipped when its data is missing or empty. */
export function HomeSections({
  hero,
  popular,
  categories,
  testimonials,
  stats,
}: Omit<HomeData, "branches">) {
  return (
    <>
      <AboutTeaser photo={photoOf(hero, popular, 1)} stats={stats} />
      {popular && popular.length > 0 ? <PopularCars cars={popular} /> : null}
      {categories && categories.length > 0 ? <CategoryChips categories={categories} /> : null}
      <PromoBanner photo={photoOf(hero, popular, 0)} />
      <HowItWorks />
      {testimonials && testimonials.length > 0 ? <Testimonials items={testimonials} /> : null}
      <FaqTeaser />
    </>
  );
}
