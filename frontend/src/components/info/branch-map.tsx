"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { PublicBranch } from "@/lib/public-api";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Navy pin with a small building glyph (Design System §6.16); decorative, the cards carry the data.
const pinIcon = L.divIcon({
  className: "",
  html: '<span class="flex size-9 items-center justify-center rounded-full border-2 border-surface bg-navy-900 text-text-on-dark shadow-md"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export type BranchMapHandle = { focus: (slug: string) => void };

/** Leaflet map with a pin per branch; `onReady` exposes `focus(slug)` for the branch cards. */
export default function BranchMap({
  branches,
  reducedMotion,
  onReady,
}: {
  branches: PublicBranch[];
  reducedMotion: boolean;
  onReady: (handle: BranchMapHandle) => void;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) {
      return;
    }
    const map = L.map(container.current, { scrollWheelZoom: false });
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);

    const markers = new Map<string, L.Marker>();
    const points: L.LatLngTuple[] = [];
    for (const branch of branches) {
      const point: L.LatLngTuple = [Number(branch.latitude), Number(branch.longitude)];
      if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        continue;
      }
      points.push(point);
      const marker = L.marker(point, { icon: pinIcon, keyboard: false, title: branch.name })
        .addTo(map)
        .bindPopup(
          `<strong>${escapeHtml(branch.name)}</strong><br>${escapeHtml(branch.address)}<br>${escapeHtml(branch.opening_time)}–${escapeHtml(branch.closing_time)} WIB`,
        );
      markers.set(branch.slug, marker);
    }
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    } else {
      map.setView([-2.5, 118], 5);
    }

    onReady({
      focus: (slug) => {
        const marker = markers.get(slug);
        if (!marker) {
          return;
        }
        if (reducedMotion) {
          map.setView(marker.getLatLng(), 15);
        } else {
          map.flyTo(marker.getLatLng(), 15, { duration: 0.6 });
        }
        marker.openPopup();
      },
    });

    return () => {
      map.remove();
    };
  }, [branches, reducedMotion, onReady]);

  return <div ref={container} className="size-full" />;
}
