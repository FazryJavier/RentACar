"use client";

import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button, DateRangePicker, Field, Select, type DateRangeValue } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PublicBranch } from "@/lib/public-api";

export type SearchValue = {
  branch: string | null;
  pickupAt: string | null;
  returnAt: string | null;
};
export type SearchErrors = Partial<Record<"branch" | "pickup_at" | "return_at", string>>;

const MAX_ADVANCE_DAYS = 90;

function wibDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/**
 * Branch + pickup/return search (also used on the home and detail pages). Dates can only be
 * chosen after the branch, limited to its opening hours and to today…+90 days (WIB).
 */
export function SearchForm({
  branches,
  value,
  errors = {},
  onSubmit,
  layout = "bar",
}: {
  branches: PublicBranch[];
  value: SearchValue;
  errors?: SearchErrors;
  onSubmit: (value: SearchValue) => void;
  layout?: "bar" | "hero";
}) {
  const [branch, setBranch] = useState(value.branch);
  const [range, setRange] = useState<DateRangeValue>({
    pickupAt: value.pickupAt,
    returnAt: value.returnAt,
  });
  const [localErrors, setLocalErrors] = useState<SearchErrors>({});
  const [limits, setLimits] = useState<{ min: string; max: string } | null>(null);
  const selected = branches.find((item) => item.slug === branch) ?? null;
  const shown = { ...errors, ...localErrors };

  useEffect(() => {
    // "Today" is read after mount so server and client render the same markup.
    const today = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLimits({
      min: wibDateKey(today),
      max: wibDateKey(new Date(today.getTime() + MAX_ADVANCE_DAYS * 86_400_000)),
    });
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: SearchErrors = {};
    if (!branch && (range.pickupAt || range.returnAt)) {
      next.branch = "Pilih cabang";
    }
    if ((range.pickupAt && !range.returnAt) || (!range.pickupAt && range.returnAt)) {
      next.pickup_at = "Pilih tanggal ambil & kembali";
    }
    setLocalErrors(next);
    if (Object.keys(next).length === 0) {
      onSubmit({ branch, pickupAt: range.pickupAt, returnAt: range.returnAt });
    }
  }

  return (
    <form
      noValidate
      role="search"
      aria-label="Cari mobil"
      onSubmit={submit}
      className={cn(
        "bg-surface flex flex-col gap-4 p-4 lg:flex-row lg:items-start",
        layout === "hero" ? "rounded-xl shadow-lg" : "rounded-lg shadow-md",
      )}
    >
      <Field label="Cabang" error={shown.branch} className="lg:w-64">
        <Select
          options={branches.map((item) => ({
            value: item.slug,
            label: `${item.name} · ${item.city}`,
          }))}
          value={branch ?? undefined}
          onValueChange={(slug) => {
            setBranch(slug);
            setLocalErrors({});
          }}
          placeholder="Pilih cabang"
        />
      </Field>
      <Field
        label="Waktu ambil & kembali"
        help={
          selected
            ? `Jam operasional ${selected.opening_time}–${selected.closing_time} WIB`
            : undefined
        }
        error={shown.pickup_at ?? shown.return_at}
        className="flex-1"
      >
        <DateRangePicker
          key={`${branch ?? "none"}-${limits?.min ?? ""}`}
          openTime={selected?.opening_time ?? "07:00"}
          closeTime={selected?.closing_time ?? "21:00"}
          minDate={limits?.min}
          maxDate={limits?.max}
          defaultValue={range}
          disabled={!selected}
          placeholder={selected ? "Pilih tanggal ambil & kembali" : "Pilih cabang dulu"}
          onChange={(next) => {
            setRange(next);
            setLocalErrors({});
          }}
        />
      </Field>
      <div className="lg:pt-7">
        <Button type="submit" className="w-full lg:w-auto">
          <Search aria-hidden="true" strokeWidth={1.75} />
          Cari
        </Button>
      </div>
    </form>
  );
}
