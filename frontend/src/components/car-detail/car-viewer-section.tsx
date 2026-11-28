"use client";

import { useCallback, useRef } from "react";
import { LazyCarViewer, type ViewerApi, type ViewerHotspot } from "@/components/car-viewer";
import { AREA_LABEL, SEVERITY } from "@/lib/condition-labels";
import type { PublicCarDetail } from "@/lib/public-api";
import { CarGallery } from "./car-gallery";
import { HotspotPanel } from "./hotspot-panel";
import { useConditionSelection } from "./selection";

function Unavailable3d({ car }: { car: PublicCarDetail }) {
  return (
    <div className="flex flex-col gap-2">
      <CarGallery photos={car.photos} name={car.name} />
      <p className="text-caption text-text-subtle">Tampilan 3D tidak tersedia</p>
    </div>
  );
}

/** Only markers with a point on the current model are drawn in 3D (others stay in the list). */
export function hotspotsOf(car: PublicCarDetail): ViewerHotspot[] {
  return car.conditions
    .filter((condition) => condition.position !== null && !condition.needs_reposition)
    .map((condition) => ({
      id: condition.number,
      number: condition.number,
      severity: condition.severity,
      label: `Penanda ${condition.number}: ${AREA_LABEL[condition.area]}, ${SEVERITY[condition.severity].label.toLowerCase()}`,
      position: condition.position!,
    }));
}

/**
 * 3D viewer with hotspots when the car has a model and the browser can show it; otherwise the
 * photo gallery with a short note.
 */
export function CarViewerSection({ car }: { car: PublicCarDetail }) {
  const { selected, open } = useConditionSelection();
  const api = useRef<ViewerApi | null>(null);
  const handleReady = useCallback((viewer: ViewerApi) => {
    api.current = viewer;
  }, []);
  const model = car.model_3d;

  if (!model) {
    return (
      <div className="flex flex-col gap-4">
        <Unavailable3d car={car} />
      </div>
    );
  }

  const poster = model.poster_url ?? car.photos[0]?.url ?? null;
  const placeholder = (
    <div className="from-surface to-bg relative h-80 w-full overflow-hidden rounded-xl bg-linear-to-b md:h-120">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- poster is the page's LCP image
        <img
          src={poster}
          alt={car.name}
          fetchPriority="high"
          className="size-full object-contain"
        />
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <LazyCarViewer
          url={model.url}
          camera={model.camera}
          illustrative={model.is_illustrative}
          hotspots={hotspotsOf(car)}
          selectedId={selected}
          onSelect={(id) => open(id, document.activeElement as HTMLElement | null)}
          onReady={handleReady}
          controls
          label={car.name}
          posterUrl={poster}
          placeholder={placeholder}
          fallback={<Unavailable3d car={car} />}
        />
        <HotspotPanel conditions={car.conditions} />
      </div>
      {car.photos.length > 0 ? <CarGallery photos={car.photos} name={car.name} /> : null}
    </div>
  );
}
