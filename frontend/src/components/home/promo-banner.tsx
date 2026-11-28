import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { home } from "@/content/home";
import type { PublicImage } from "@/lib/public-api";
import { Reveal } from "./reveal";
import { HomeSection } from "./section-heading";

/** Illustrative offer on navy; always labelled as demo (no discount exists anywhere). */
export function PromoBanner({ photo }: { photo: PublicImage | null }) {
  const copy = home.promo;
  return (
    <HomeSection labelledBy="promo-title">
      <Reveal>
        <div className="bg-navy-900 relative isolate overflow-hidden rounded-xl">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- car photo from /storage with WebP srcset
            <img
              src={photo.url}
              srcSet={photo.srcset}
              sizes="(min-width: 1024px) 60vw, 100vw"
              alt=""
              loading="lazy"
              className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-60 lg:w-3/5"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="from-navy-900 via-navy-900/90 absolute inset-0 -z-10 bg-linear-to-r to-transparent"
          />
          <div className="max-w-form flex flex-col gap-4 p-8 lg:p-12">
            <Badge tone="accent" size="md" className="self-start">
              {copy.badge}
            </Badge>
            <h2 id="promo-title" className="text-h1 text-text-on-dark">
              {copy.titleStart} <span className="text-accent-soft">{copy.titleAccent}</span>{" "}
              {copy.titleEnd}
            </h2>
            <p className="text-body-lg text-text-on-dark-muted">{copy.text}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild variant="light" size="lg" arrow>
                <Link href="/armada">Pesan Sekarang</Link>
              </Button>
              <span className="text-caption text-text-on-dark-muted">{copy.label}</span>
            </div>
          </div>
        </div>
      </Reveal>
    </HomeSection>
  );
}
