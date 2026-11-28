import { Quote, Star } from "lucide-react";
import { Badge } from "@/components/ui";
import { home } from "@/content/home";
import { cn } from "@/lib/cn";
import type { PublicTestimonial } from "@/lib/public-api";
import { Carousel } from "./carousel";
import { Reveal } from "./reveal";
import { HomeSection, SectionHeading } from "./section-heading";

const MAX_ITEMS = 3;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TestimonialCard({ item }: { item: PublicTestimonial }) {
  return (
    <figure className="bg-surface flex h-full flex-col gap-4 rounded-lg p-6 shadow-md">
      <Quote aria-hidden="true" strokeWidth={1.75} className="text-accent size-6" />
      <blockquote className="text-body text-text line-clamp-3">{item.quote}</blockquote>
      <p className="flex items-center gap-1" role="img" aria-label={`Rating ${item.rating} dari 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            strokeWidth={1.75}
            className={cn(
              "size-4",
              star <= item.rating ? "fill-accent text-accent" : "text-border-strong",
            )}
          />
        ))}
      </p>
      <figcaption className="mt-auto flex items-center gap-3">
        {item.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- illustrated avatar from /storage
          <img
            src={item.avatar_url}
            alt=""
            loading="lazy"
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="bg-accent-tint text-accent-hover text-body-sm inline-flex size-10 items-center justify-center rounded-full font-semibold"
          >
            {initials(item.name)}
          </span>
        )}
        <span className="flex flex-col">
          <span className="text-body-sm text-text font-semibold">{item.name}</span>
          {item.city ? <span className="text-caption text-text-muted">{item.city}</span> : null}
        </span>
      </figcaption>
      {item.is_demo ? (
        <Badge tone="neutral" className="self-start">
          {home.testimonials.demoLabel}
        </Badge>
      ) : null}
    </figure>
  );
}

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  const shown = items.slice(0, MAX_ITEMS);
  return (
    <HomeSection labelledBy="testimonials-title">
      <Reveal>
        <SectionHeading
          id="testimonials-title"
          title={home.testimonials.title}
          subtitle={home.testimonials.subtitle}
        />
        <Carousel
          label="Testimoni"
          itemClassName="basis-5/6 sm:basis-5/11 lg:basis-1/3"
          controls="none"
        >
          {shown.map((item, index) => (
            <TestimonialCard key={index} item={item} />
          ))}
        </Carousel>
      </Reveal>
    </HomeSection>
  );
}
