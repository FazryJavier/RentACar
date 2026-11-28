import { Clock, Tag, Zap } from "lucide-react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { home } from "@/content/home";
import type { PublicBranch } from "@/lib/public-api";
import { DecorBlob } from "./decor-blob";
import { HeroSearch } from "./hero-search";
import { HeroViewer } from "./hero-viewer";
import type { HeroCar } from "./pick-hero-car";
import { VideoDialog } from "./video-dialog";

const ADVANTAGE_ICONS = [Clock, Zap, Tag];

/** Poster (LCP, server-rendered) with the 3D viewer mounted over it on the client. */
function HeroVisual({ hero }: { hero: HeroCar }) {
  if (hero.kind === "none") {
    return null;
  }
  const car = hero.car;
  return (
    <div className="relative">
      <div
        role="img"
        aria-label={`Model 3D ${car.name}`}
        className="from-surface to-bg relative h-72 overflow-hidden rounded-xl bg-linear-to-b sm:h-96 lg:h-120"
      >
        {hero.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- poster from /storage, sized by its box
          <img
            src={hero.posterUrl}
            alt=""
            width={960}
            height={600}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-contain"
          />
        ) : null}
        {hero.kind === "model" ? <HeroViewer car={hero.car} posterUrl={hero.posterUrl} /> : null}
      </div>
      <Link
        href={`/armada/${car.slug}`}
        className="text-body-sm text-accent hover:text-accent-hover focus-visible:focus-ring mt-3 inline-flex min-h-11 items-center rounded-sm font-semibold"
      >
        Lihat detail {car.name}
      </Link>
    </div>
  );
}

export function Hero({ hero, branches }: { hero: HeroCar; branches: PublicBranch[] | null }) {
  const copy = home.hero;
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <DecorBlob className="-top-24 -right-16 hidden size-80 opacity-30 lg:block" />
      <div className="max-w-page relative z-(--z-content) mx-auto px-4 pt-8 pb-16 md:px-6 lg:pt-12 lg:pb-24 xl:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-6">
            <Badge tone="accent" size="md" dot className="self-start">
              {copy.badge}
            </Badge>
            <h1 id="hero-title" className="text-display text-text">
              {copy.titleStart} <span className="text-accent">{copy.titleAccent}</span>{" "}
              {copy.titleEnd}
            </h1>
            <p className="text-body-lg text-text-muted max-w-form">{copy.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" arrow>
                <Link href="/armada">Lihat Armada</Link>
              </Button>
              <VideoDialog />
            </div>
          </div>
          <HeroVisual hero={hero} />
        </div>

        {branches ? (
          <div className="mt-10">
            <HeroSearch branches={branches} />
          </div>
        ) : null}

        <ul className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Keunggulan">
          {copy.advantages.map((label, index) => {
            const Icon = ADVANTAGE_ICONS[index] ?? Clock;
            return (
              <li key={label} className="text-body text-text flex items-center gap-3 font-semibold">
                <span className="bg-accent-wash text-accent inline-flex size-10 items-center justify-center rounded-full">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-5" />
                </span>
                {label}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
