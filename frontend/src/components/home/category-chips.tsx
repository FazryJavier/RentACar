import Link from "next/link";
import { home } from "@/content/home";
import type { PublicCategory } from "@/lib/public-api";
import { HomeSection } from "./section-heading";

/** Category shortcuts into the fleet page (`/armada?category=<slug>`). */
export function CategoryChips({ categories }: { categories: PublicCategory[] }) {
  return (
    <HomeSection labelledBy="categories-title" className="py-0 lg:py-0">
      <h2 id="categories-title" className="text-h3 text-text mb-4">
        {home.categories.title}
      </h2>
      <ul className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/armada?category=${encodeURIComponent(category.slug)}`}
              className="text-body-sm border-border bg-surface text-text hover:bg-surface-muted focus-visible:focus-ring ease-standard inline-flex h-11 items-center rounded-full border px-5 font-medium transition-colors duration-(--motion-fast)"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
