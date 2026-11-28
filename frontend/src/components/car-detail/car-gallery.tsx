"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { PublicImage } from "@/lib/public-api";

const MAIN_SIZES = "(min-width: 1024px) 60vw, 100vw";

/** Main photo with selectable thumbnails; a neutral placeholder when there are no photos. */
export function CarGallery({ photos, name }: { photos: PublicImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const main = photos[index];

  if (!main) {
    return (
      <div className="bg-surface-muted text-text-subtle flex h-80 flex-col items-center justify-center gap-2 rounded-xl md:h-120">
        <ImageOff aria-hidden="true" strokeWidth={1.75} className="size-10" />
        <span className="text-body-sm">Foto belum tersedia</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- WebP variants with srcset from /storage */}
      <img
        src={main.url}
        srcSet={main.srcset}
        sizes={MAIN_SIZES}
        alt={main.alt || name}
        className="bg-surface-muted h-80 w-full rounded-xl object-contain md:h-120"
      />
      {photos.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Foto lainnya">
          {photos.map((photo, position) => (
            <li key={photo.url} className="shrink-0">
              <button
                type="button"
                aria-label={`Foto ${position + 1} dari ${photos.length}`}
                aria-pressed={position === index}
                onClick={() => setIndex(position)}
                className={cn(
                  "focus-visible:focus-ring block overflow-hidden rounded-md border-2",
                  position === index ? "border-accent" : "border-transparent",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail variant */}
                <img
                  src={photo.url}
                  srcSet={photo.srcset}
                  sizes="96px"
                  alt=""
                  loading="lazy"
                  className="bg-surface-muted h-16 w-24 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
