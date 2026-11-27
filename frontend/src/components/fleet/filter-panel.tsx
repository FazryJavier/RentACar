"use client";

import { useState } from "react";
import { Button, Checkbox, Chip, Field, RadioGroup, RangeSlider } from "@/components/ui";
import {
  FUEL_TYPES,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  SEAT_OPTIONS,
  type FleetParams,
} from "@/lib/fleet-params";
import { formatRupiah } from "@/lib/format";
import type { PublicBrand, PublicCategory } from "@/lib/public-api";
import { FUEL_LABEL } from "./labels";

export type FilterValue = Pick<
  FleetParams,
  "category" | "brand" | "fuelType" | "transmission" | "seatsMin" | "priceMin" | "priceMax"
>;

export const EMPTY_FILTERS: FilterValue = {
  category: [],
  brand: [],
  fuelType: [],
  transmission: null,
  seatsMin: null,
  priceMin: null,
  priceMax: null,
};

function toggle(list: string[], item: string, on: boolean): string[] {
  return on ? [...list, item] : list.filter((value) => value !== item);
}

/** Filter controls; every change is reported at once (the sheet keeps its own draft). */
export function FilterPanel({
  value,
  categories,
  brands,
  onChange,
}: {
  value: FilterValue;
  categories: PublicCategory[];
  brands: PublicBrand[];
  onChange: (changes: Partial<FilterValue>) => void;
}) {
  const committed: [number, number] = [value.priceMin ?? PRICE_MIN, value.priceMax ?? PRICE_MAX];
  const [price, setPrice] = useState<[number, number] | null>(null);
  const shown = price ?? committed;

  function commitPrice([low, high]: [number, number]) {
    setPrice(null);
    onChange({
      priceMin: low <= PRICE_MIN ? null : low,
      priceMax: high >= PRICE_MAX ? null : high,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-body-sm text-text mb-3 font-semibold">Kategori</legend>
        {categories.map((category) => (
          <Checkbox
            key={category.slug}
            label={category.name}
            checked={value.category.includes(category.slug)}
            onCheckedChange={(on) =>
              onChange({ category: toggle(value.category, category.slug, on) })
            }
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-body-sm text-text mb-3 font-semibold">Merek</legend>
        {brands.map((brand) => (
          <Checkbox
            key={brand.slug}
            label={brand.name}
            checked={value.brand.includes(brand.slug)}
            onCheckedChange={(on) => onChange({ brand: toggle(value.brand, brand.slug, on) })}
          />
        ))}
      </fieldset>
      <Field label="Transmisi">
        <RadioGroup
          options={[
            { value: "all", label: "Semua" },
            { value: "automatic", label: "Otomatis" },
            { value: "manual", label: "Manual" },
          ]}
          value={value.transmission ?? "all"}
          onValueChange={(next) =>
            onChange({
              transmission: next === "all" ? null : (next as FilterValue["transmission"]),
            })
          }
        />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-body-sm text-text mb-3 font-semibold">Kursi minimal</legend>
        <div className="flex flex-wrap gap-2">
          {SEAT_OPTIONS.map((seats) => (
            <Chip
              key={seats}
              pressed={value.seatsMin === seats}
              onPressedChange={(on) => onChange({ seatsMin: on ? seats : null })}
            >
              {seats}+
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-body-sm text-text mb-3 font-semibold">Bahan bakar</legend>
        {FUEL_TYPES.map((fuel) => (
          <Checkbox
            key={fuel}
            label={FUEL_LABEL[fuel]}
            checked={value.fuelType.includes(fuel)}
            onCheckedChange={(on) => onChange({ fuelType: toggle(value.fuelType, fuel, on) })}
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-body-sm text-text mb-3 font-semibold">Harga per hari</legend>
        <RangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={shown}
          onValueChange={setPrice}
          onValueCommit={commitPrice}
          thumbLabels={["Harga minimum", "Harga maksimum"]}
          formatValue={formatRupiah}
        />
        <p className="text-body-sm text-text-muted tabular">
          {formatRupiah(shown[0])} –{" "}
          {shown[1] >= PRICE_MAX ? `${formatRupiah(PRICE_MAX)}+` : formatRupiah(shown[1])}
        </p>
      </fieldset>
    </div>
  );
}

export function FilterResetButton({
  onReset,
  disabled,
}: {
  onReset: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
      Reset
    </Button>
  );
}
