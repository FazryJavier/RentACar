"use client";

import { LayoutGrid, List } from "lucide-react";
import { IconButton, Select } from "@/components/ui";
import type { FleetSort } from "@/lib/fleet-params";
import { SORT_OPTIONS } from "./labels";

export function SortSelect({
  value,
  onChange,
}: {
  value: FleetSort;
  onChange: (value: FleetSort) => void;
}) {
  return (
    <Select
      size="sm"
      aria-label="Urutkan"
      options={SORT_OPTIONS}
      value={value}
      onValueChange={(next) => onChange(next as FleetSort)}
      className="w-40"
    />
  );
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
}) {
  return (
    <div className="hidden gap-1 sm:flex" role="group" aria-label="Tampilan">
      <IconButton
        variant={value === "grid" ? "solid" : "ghost"}
        aria-label="Tampilan grid"
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid aria-hidden="true" strokeWidth={1.75} />
      </IconButton>
      <IconButton
        variant={value === "list" ? "solid" : "ghost"}
        aria-label="Tampilan daftar"
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        <List aria-hidden="true" strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}
