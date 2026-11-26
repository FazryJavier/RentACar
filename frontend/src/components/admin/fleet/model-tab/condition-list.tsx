"use client";

import { Pencil, TriangleAlert } from "lucide-react";
import { Badge, IconButton } from "@/components/ui";
import type { CarCondition } from "@/lib/admin-api";
import { AREA_LABEL, SEVERITY } from "./labels";

/** Text list of markers (the accessible alternative to the 3D hotspots). */
export function ConditionList({
  conditions,
  selectedId,
  onEdit,
}: {
  conditions: CarCondition[];
  selectedId: number | null;
  onEdit: (condition: CarCondition) => void;
}) {
  if (conditions.length === 0) {
    return <p className="text-body-sm text-text-muted">Belum ada penanda kondisi.</p>;
  }

  return (
    <ol className="flex flex-col gap-2" aria-label="Daftar penanda">
      {conditions.map((condition) => {
        const severity = SEVERITY[condition.severity];
        return (
          <li
            key={condition.id}
            className={`border-border flex items-center gap-3 rounded-md border p-3 ${selectedId === condition.id ? "bg-accent-wash" : ""}`}
          >
            <span className="bg-navy-900 text-caption text-text-on-dark inline-flex size-7 shrink-0 items-center justify-center rounded-full font-bold">
              {condition.number}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-body-sm text-text truncate font-semibold">
                {AREA_LABEL[condition.area]} · {condition.description}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone={severity.tone}>{severity.label}</Badge>
                <Badge tone={condition.is_resolved ? "neutral" : "info"}>
                  {condition.is_resolved ? "Sudah diperbaiki" : "Aktif"}
                </Badge>
                {condition.needs_reposition ? (
                  <Badge tone="warning">
                    <TriangleAlert aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                    Perlu penyesuaian posisi
                  </Badge>
                ) : null}
              </span>
            </span>
            <IconButton
              variant="ghost"
              aria-label={`Ubah penanda ${condition.number}`}
              onClick={() => onEdit(condition)}
            >
              <Pencil aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
          </li>
        );
      })}
    </ol>
  );
}
