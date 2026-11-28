"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge, BottomSheetContent, Dialog, IconButton } from "@/components/ui";
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { AREA_LABEL, SEVERITY } from "@/lib/condition-labels";
import type { PublicCondition } from "@/lib/public-api";
import { formatDateOnly } from "./labels";
import { useConditionSelection } from "./selection";

function PanelBody({ condition }: { condition: PublicCondition }) {
  const severity = SEVERITY[condition.severity];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-body-sm text-text-muted">
        Tingkat: <Badge tone={severity.tone}>{severity.label}</Badge>
      </p>
      <p className="text-body text-text">{condition.description}</p>
      {condition.photos.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Foto kondisi">
          {condition.photos.map((photo, index) => (
            <li key={photo.url}>
              {/* eslint-disable-next-line @next/next/no-img-element -- condition photo from /storage */}
              <img
                src={photo.url}
                alt={`Foto kondisi ${condition.number} (${index + 1})`}
                loading="lazy"
                className="bg-surface-muted size-24 rounded-md object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-caption text-text-subtle">
        Inspeksi: {formatDateOnly(condition.inspected_on)}
      </p>
    </div>
  );
}

function title(condition: PublicCondition): string {
  return `${condition.number}. ${AREA_LABEL[condition.area]}`;
}

/**
 * Details of the selected condition: a card over the viewer on desktop, a bottom sheet on phones.
 * Escape or the close button closes it and returns focus to the hotspot or list item.
 */
export function HotspotPanel({ conditions }: { conditions: PublicCondition[] }) {
  const { selected, close } = useConditionSelection();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const heading = useRef<HTMLHeadingElement>(null);
  const condition = conditions.find((item) => item.number === selected) ?? null;

  useEffect(() => {
    if (condition && desktop) {
      heading.current?.focus();
    }
  }, [condition, desktop]);

  if (!condition) {
    return null;
  }

  if (!desktop) {
    return (
      <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
        <BottomSheetContent title={title(condition)}>
          <PanelBody condition={condition} />
        </BottomSheetContent>
      </Dialog>
    );
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="hotspot-panel-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          close();
        }
      }}
      className="bg-surface absolute top-3 right-3 z-10 flex w-72 flex-col gap-3 rounded-lg p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id="hotspot-panel-title"
          ref={heading}
          tabIndex={-1}
          className="text-h4 text-text focus-visible:focus-ring rounded-sm"
        >
          {title(condition)}
        </h3>
        <IconButton variant="ghost" aria-label="Tutup detail kondisi" onClick={close}>
          <X aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
      </div>
      <PanelBody condition={condition} />
    </section>
  );
}
