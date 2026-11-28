import { Check, Eye, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { about } from "@/content/about";
import type { PublicBranch, PublicImage, PublicStats } from "@/lib/public-api";
import { InfoContainer, InfoHeader } from "./prose-page";
import { StatsList } from "./stats-list";

const VALUE_ICONS = [Eye, Wrench, Sparkles, ShieldCheck];

export function AboutView({
  photo,
  stats,
  branches,
}: {
  photo: PublicImage | null;
  stats: PublicStats | null;
  branches: PublicBranch[] | null;
}) {
  return (
    <InfoContainer className="flex flex-col gap-16 lg:gap-24">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <InfoHeader title={about.title} lead={about.lead} />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- car photo from /storage with WebP srcset
          <img
            src={photo.url}
            srcSet={photo.srcset}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={photo.alt}
            fetchPriority="high"
            className="bg-surface-muted h-72 w-full rounded-xl object-cover sm:h-96"
          />
        ) : (
          <div
            aria-hidden="true"
            className="from-accent-wash to-surface-muted h-72 rounded-xl bg-linear-to-br sm:h-96"
          />
        )}
      </div>

      <section aria-labelledby="story-title" className="max-w-form flex flex-col gap-4">
        <Badge tone="neutral" size="md" className="self-start">
          {about.demoLabel}
        </Badge>
        <h2 id="story-title" className="text-h2 text-text">
          Cerita kami
        </h2>
        {about.story.map((paragraph) => (
          <p key={paragraph} className="text-body-lg text-text-muted">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="vision-title" className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 id="vision-title" className="text-h2 text-text">
            Visi
          </h2>
          <p className="text-body-lg text-text-muted">{about.vision}</p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-h2 text-text">Misi</h2>
          <ul className="flex flex-col gap-2">
            {about.mission.map((item) => (
              <li key={item} className="text-body-lg text-text-muted flex gap-2">
                <Check
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="text-accent mt-1 size-5 shrink-0"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="values-title">
        <h2 id="values-title" className="text-h2 text-text mb-8">
          Nilai layanan
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.values.map((value, index) => {
            const Icon = VALUE_ICONS[index] ?? Check;
            return (
              <li
                key={value.title}
                className="bg-surface flex flex-col gap-3 rounded-lg p-6 shadow-md"
              >
                <span className="bg-accent-wash text-accent inline-flex size-10 items-center justify-center rounded-full">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-5" />
                </span>
                <h3 className="text-h4 text-text">{value.title}</h3>
                <p className="text-body-sm text-text-muted">{value.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {stats ? (
        <section aria-labelledby="stats-title">
          <h2 id="stats-title" className="text-h2 text-text mb-8">
            RentACar dalam angka
          </h2>
          <StatsList stats={stats} labels={about.stats} />
        </section>
      ) : null}

      {branches && branches.length > 0 ? (
        <section aria-labelledby="branches-title">
          <h2 id="branches-title" className="text-h2 text-text mb-8">
            Cabang kami
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <li key={branch.slug} className="bg-surface rounded-lg p-4 shadow-sm">
                <p className="text-body text-text font-semibold">{branch.name}</p>
                <p className="text-body-sm text-text-muted">{branch.city}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/cabang"
            className="text-body text-accent hover:text-accent-hover focus-visible:focus-ring mt-6 inline-flex min-h-11 items-center rounded-sm font-semibold"
          >
            Lihat alamat dan peta cabang
          </Link>
        </section>
      ) : null}

      <section
        aria-labelledby="cta-title"
        className="bg-navy-900 flex flex-col items-start gap-4 rounded-xl p-8 lg:p-12"
      >
        <h2 id="cta-title" className="text-h2 text-text-on-dark">
          Siap mencari mobil?
        </h2>
        <p className="text-body-lg text-text-on-dark-muted">
          Lihat mobil yang tersedia di cabang terdekat.
        </p>
        <Button asChild variant="light" size="lg" arrow>
          <Link href="/armada">Lihat Armada</Link>
        </Button>
      </section>
    </InfoContainer>
  );
}
