"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

export type LatLng = { lat: number; lng: number };

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const markerIcon = L.divIcon({
  className: "",
  html: '<span class="block size-5 rounded-full border-surface bg-accent shadow-md border-2"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/** Leaflet map with one draggable marker; a click or a drag reports the new position. */
export default function BranchMap({
  value,
  onChange,
  readOnly = false,
}: {
  value: LatLng;
  onChange?: (value: LatLng) => void;
  readOnly?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const changeRef = useRef(onChange);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!container.current) {
      return;
    }
    const instance = L.map(container.current, { scrollWheelZoom: false }).setView(
      [value.lat, value.lng],
      13,
    );
    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(instance);
    const pin = L.marker([value.lat, value.lng], {
      icon: markerIcon,
      draggable: !readOnly,
      keyboard: false,
    }).addTo(instance);

    const report = (point: L.LatLng) => changeRef.current?.({ lat: point.lat, lng: point.lng });
    if (!readOnly) {
      pin.on("dragend", () => report(pin.getLatLng()));
      instance.on("click", (event: L.LeafletMouseEvent) => {
        pin.setLatLng(event.latlng);
        report(event.latlng);
      });
    }

    map.current = instance;
    marker.current = pin;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // The map is created once; position updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const pin = marker.current;
    if (!pin || !Number.isFinite(value.lat) || !Number.isFinite(value.lng)) {
      return;
    }
    const current = pin.getLatLng();
    if (current.lat !== value.lat || current.lng !== value.lng) {
      pin.setLatLng([value.lat, value.lng]);
      map.current?.panTo([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  return (
    <div
      ref={container}
      className="border-border z-0 h-64 w-full rounded-md border"
      aria-hidden="true"
    />
  );
}
