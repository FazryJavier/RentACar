"use client";

import dynamic from "next/dynamic";
import { Field, Input, Skeleton } from "@/components/ui";
import type { LatLng } from "./branch-map";

export const DEFAULT_POSITION: LatLng = { lat: -6.2, lng: 106.816666 };

const BranchMap = dynamic(() => import("./branch-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-md" />,
});

function toNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

/**
 * Location picker: click or drag the marker on the map, or type the coordinates. The map is
 * a pointer convenience; the latitude/longitude inputs stay the accessible way to set it.
 */
export function BranchMapPicker({
  latitude,
  longitude,
  onChange,
  errors,
}: {
  latitude: string;
  longitude: string;
  onChange: (value: { latitude: string; longitude: string }) => void;
  errors?: { latitude?: string; longitude?: string };
}) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);
  const position = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : DEFAULT_POSITION;

  return (
    <div className="flex flex-col gap-3">
      <BranchMap
        value={position}
        onChange={(point) =>
          onChange({ latitude: point.lat.toFixed(6), longitude: point.lng.toFixed(6) })
        }
      />
      <p className="text-body-sm text-text-muted">
        Klik peta atau geser penanda, atau isi koordinat di bawah.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" error={errors?.latitude} required>
          <Input
            size="sm"
            inputMode="decimal"
            value={latitude}
            onChange={(event) => onChange({ latitude: event.target.value, longitude })}
          />
        </Field>
        <Field label="Longitude" error={errors?.longitude} required>
          <Input
            size="sm"
            inputMode="decimal"
            value={longitude}
            onChange={(event) => onChange({ latitude, longitude: event.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
