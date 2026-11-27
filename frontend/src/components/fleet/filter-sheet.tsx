"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { BottomSheetContent, Button, Dialog, DialogTrigger } from "@/components/ui";
import type { PublicBrand, PublicCategory } from "@/lib/public-api";
import { EMPTY_FILTERS, FilterPanel, type FilterValue } from "./filter-panel";

/** Filters in a bottom sheet below 1024 px; changes apply on "Terapkan". */
export function FilterSheet({
  value,
  activeCount,
  categories,
  brands,
  onApply,
}: {
  value: FilterValue;
  activeCount: number;
  categories: PublicCategory[];
  brands: PublicBrand[];
  onApply: (value: FilterValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(value);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="lg:hidden">
          <SlidersHorizontal aria-hidden="true" strokeWidth={1.75} />
          {activeCount > 0 ? `Filter (${activeCount})` : "Filter"}
        </Button>
      </DialogTrigger>
      <BottomSheetContent title="Filter" className="pb-0">
        <div className="pt-4 pb-6">
          <FilterPanel
            value={draft}
            categories={categories}
            brands={brands}
            onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
          />
        </div>
        <div className="bg-surface border-border sticky bottom-0 -mx-6 flex gap-3 border-t px-6 pt-4 pb-6">
          <Button variant="secondary" className="flex-1" onClick={() => setDraft(EMPTY_FILTERS)}>
            Reset
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Terapkan
          </Button>
        </div>
      </BottomSheetContent>
    </Dialog>
  );
}
