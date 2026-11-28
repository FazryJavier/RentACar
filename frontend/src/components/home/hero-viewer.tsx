"use client";

import { LazyCarViewer } from "@/components/car-viewer";
import type { PublicCarDetail } from "@/lib/public-api";

/**
 * Client part of the hero car: mounts the 3D viewer (hero mode, no controls) over the
 * server-rendered poster once the area is visible and WebGL is available. Any failure keeps
 * the poster.
 */
export function HeroViewer({ car, posterUrl }: { car: PublicCarDetail; posterUrl: string | null }) {
  if (!car.model_3d) {
    return null;
  }
  return (
    <LazyCarViewer
      wrapperClassName="absolute inset-0"
      url={car.model_3d.url}
      camera={car.model_3d.camera}
      illustrative={car.model_3d.is_illustrative}
      label={car.name}
      posterUrl={posterUrl}
      autoRotate
      className="h-full bg-none md:h-full"
      fallback={null}
      placeholder={null}
    />
  );
}
