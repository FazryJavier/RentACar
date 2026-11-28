"use client";

import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { AREA_LABEL, SEVERITY } from "@/lib/condition-labels";
import { formatDateWib } from "@/lib/format";
import type { PublicCarDetail } from "@/lib/public-api";
import { formatDateOnly } from "./labels";
import { useConditionSelection } from "./selection";

const numberFormat = new Intl.NumberFormat("id-ID");

/** Inspection summary and the numbered list of active markers (text alternative). */
export function ConditionSection({ car }: { car: PublicCarDetail }) {
  const { open } = useConditionSelection();
  const summary = car.inspection_summary;
  const counts = (["minor", "moderate", "major"] as const).filter(
    (severity) => summary.active_conditions[severity] > 0,
  );

  return (
    <section aria-labelledby="kondisi-mobil" className="flex flex-col gap-4">
      <h2 id="kondisi-mobil" className="text-h3 text-text">
        Kondisi mobil
      </h2>
      <dl className="text-body-sm text-text-muted flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex gap-1">
          <dt>Inspeksi terakhir:</dt>
          <dd className="text-text font-medium">
            {summary.last_inspected_at ? formatDateWib(summary.last_inspected_at) : "Belum ada"}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt>Catatan aktif:</dt>
          <dd className="text-text font-medium">
            {counts.length === 0
              ? "0"
              : counts
                  .map(
                    (severity) =>
                      `${summary.active_conditions[severity]} ${SEVERITY[severity].label.toLowerCase()}`,
                  )
                  .join(" · ")}
          </dd>
        </div>
        {summary.odometer_km !== null ? (
          <div className="flex gap-1">
            <dt>Odometer:</dt>
            <dd className="text-text tabular font-medium">
              {numberFormat.format(summary.odometer_km)} km
            </dd>
          </div>
        ) : null}
      </dl>

      {car.conditions.length === 0 ? (
        <p className="text-body-sm text-text-muted flex items-center gap-2">
          <ClipboardCheck aria-hidden="true" strokeWidth={1.75} className="text-success size-5" />
          Tidak ada catatan kerusakan aktif
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {car.conditions.map((condition) => {
            const severity = SEVERITY[condition.severity];
            return (
              <li key={condition.number}>
                <button
                  type="button"
                  onClick={(event) => open(condition.number, event.currentTarget)}
                  className="bg-surface hover:bg-surface-muted focus-visible:focus-ring flex w-full items-start gap-3 rounded-md p-3 text-left shadow-sm"
                >
                  <span
                    aria-hidden="true"
                    className="bg-navy-900 text-text-on-dark text-caption inline-flex size-7 shrink-0 items-center justify-center rounded-full font-bold"
                  >
                    {condition.number}
                  </span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="text-body text-text flex flex-wrap items-center gap-2 font-semibold">
                      <span className="sr-only">Catatan {condition.number}: </span>
                      {AREA_LABEL[condition.area]}
                      <Badge tone={severity.tone}>{severity.label}</Badge>
                    </span>
                    <span className="text-body-sm text-text-muted">{condition.description}</span>
                    <span className="text-caption text-text-subtle">
                      Inspeksi {formatDateOnly(condition.inspected_on)}
                      {condition.photos.length > 0 ? ` · ${condition.photos.length} foto` : ""}
                      {condition.position === null || condition.needs_reposition
                        ? " · tidak ditandai di model 3D"
                        : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
