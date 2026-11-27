"use client";

import { Button, Chip } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { PublicBrand, PublicCategory } from "@/lib/public-api";
import type { FilterValue } from "./filter-panel";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "./labels";

type ActiveChip = { key: string; label: string; remove: Partial<FilterValue> };

function chipsOf(
  value: FilterValue,
  categories: PublicCategory[],
  brands: PublicBrand[],
): ActiveChip[] {
  const name = (list: { slug: string; name: string }[], slug: string) =>
    list.find((item) => item.slug === slug)?.name ?? slug;
  const chips: ActiveChip[] = [
    ...value.category.map((slug) => ({
      key: `category-${slug}`,
      label: name(categories, slug),
      remove: { category: value.category.filter((item) => item !== slug) },
    })),
    ...value.brand.map((slug) => ({
      key: `brand-${slug}`,
      label: name(brands, slug),
      remove: { brand: value.brand.filter((item) => item !== slug) },
    })),
    ...value.fuelType.map((fuel) => ({
      key: `fuel-${fuel}`,
      label: FUEL_LABEL[fuel as keyof typeof FUEL_LABEL] ?? fuel,
      remove: { fuelType: value.fuelType.filter((item) => item !== fuel) },
    })),
  ];
  if (value.transmission) {
    chips.push({
      key: "transmission",
      label: TRANSMISSION_LABEL[value.transmission],
      remove: { transmission: null },
    });
  }
  if (value.seatsMin !== null) {
    chips.push({ key: "seats", label: `${value.seatsMin}+ kursi`, remove: { seatsMin: null } });
  }
  if (value.priceMin !== null || value.priceMax !== null) {
    const low = value.priceMin !== null ? formatRupiah(value.priceMin) : "Rp0";
    const high = value.priceMax !== null ? formatRupiah(value.priceMax) : "∞";
    chips.push({
      key: "price",
      label: `${low} – ${high}`,
      remove: { priceMin: null, priceMax: null },
    });
  }
  return chips;
}

/** One removable chip per active filter, plus "Hapus semua". */
export function ActiveFilterChips({
  value,
  categories,
  brands,
  onChange,
  onClear,
}: {
  value: FilterValue;
  categories: PublicCategory[];
  brands: PublicBrand[];
  onChange: (changes: Partial<FilterValue>) => void;
  onClear: () => void;
}) {
  const chips = chipsOf(value, categories, brands);
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filter aktif" role="group">
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          pressed
          onPressedChange={() => onChange(chip.remove)}
          onRemove={() => onChange(chip.remove)}
          removeLabel={`Hapus filter ${chip.label}`}
        >
          {chip.label}
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Hapus semua
      </Button>
    </div>
  );
}
