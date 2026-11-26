"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { CarViewer, type ViewerApi, type ViewerHotspot } from "@/components/car-viewer";
import { Button, Checkbox } from "@/components/ui";
import { carModelApi, conditionsApi, type Car, type CarCondition } from "@/lib/admin-api";
import { ConditionForm, type DraftPoint } from "./condition-form";
import { ConditionList } from "./condition-list";
import { InspectionLog } from "./inspection-log";
import { AREA_LABEL, SEVERITY } from "./labels";
import { ModelPanel } from "./model-panel";

export function conditionsKey(carId: number) {
  return ["admin-car-conditions", carId] as const;
}

type Editing =
  | { kind: "none" }
  | { kind: "new"; point: DraftPoint | null }
  | { kind: "edit"; id: number }
  | { kind: "move"; id: number };

/** Tab "Model 3D & Kondisi": model upload, 3D marker editor, marker list/form and inspections. */
export function ModelTab({ car }: { car: Car }) {
  const queryClient = useQueryClient();
  const api = useRef<ViewerApi | null>(null);
  const [editing, setEditing] = useState<Editing>({ kind: "none" });
  const [showResolved, setShowResolved] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const query = useQuery({
    queryKey: conditionsKey(car.id),
    queryFn: ({ signal }) => conditionsApi.list(car.id, signal),
  });
  const model = car.model_3d;
  const conditions = useMemo(() => query.data ?? [], [query.data]);
  const visible = conditions.filter((condition) => showResolved || !condition.is_resolved);
  const selectedId = editing.kind === "edit" || editing.kind === "move" ? editing.id : null;
  const selected = conditions.find((condition) => condition.id === selectedId) ?? null;
  const placing = editing.kind === "move" || (editing.kind === "new" && editing.point === null);

  const hotspots = useMemo<ViewerHotspot[]>(() => {
    const list: ViewerHotspot[] = visible
      .filter((condition) => condition.position !== null && !condition.needs_reposition)
      .map((condition) => ({
        id: condition.id,
        number: condition.number,
        severity: condition.severity,
        position: condition.position!,
        label: `Penanda ${condition.number}: ${AREA_LABEL[condition.area]}, ${SEVERITY[condition.severity].label.toLowerCase()}`,
      }));
    if (editing.kind === "new" && editing.point) {
      list.push({
        id: -1,
        number: conditions.length + 1,
        severity: "minor",
        position: editing.point.position,
        label: "Penanda baru",
      });
    }
    return list;
  }, [visible, editing, conditions.length]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: conditionsKey(car.id) });

  async function handlePlace(point: DraftPoint) {
    if (editing.kind === "move") {
      await conditionsApi.update(car.id, editing.id, point);
      setAnnouncement("Titik penanda dipindahkan.");
      setEditing({ kind: "edit", id: editing.id });
      await refresh();
      return;
    }
    if (editing.kind === "new") {
      setAnnouncement("Titik dipilih. Lengkapi form penanda.");
      setEditing({ kind: "new", point });
    }
  }

  const saveCamera = useCallback(async () => {
    const viewer = api.current;
    if (!viewer) {
      return;
    }
    await carModelApi.update(car.id, { camera: viewer.getCamera() });
    const poster = await viewer.capturePoster();
    if (poster) {
      await carModelApi.poster(car.id, poster);
    }
  }, [car.id]);

  function afterSave(saved: CarCondition) {
    setEditing({ kind: "edit", id: saved.id });
    void refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="flex flex-col gap-4 lg:col-span-2">
        {model ? (
          <CarViewer
            mode="editor"
            url={model.url}
            camera={model.camera}
            illustrative={model.is_illustrative}
            hotspots={hotspots}
            selectedId={selectedId}
            placing={placing}
            onSelect={(id) => id > 0 && setEditing({ kind: "edit", id })}
            onPlace={(point) => void handlePlace(point)}
            onReady={(viewer) => {
              api.current = viewer;
            }}
            fallback={
              <p className="bg-surface-muted text-body-sm text-text-muted rounded-xl p-6">
                Tampilan 3D tidak tersedia di perangkat ini. Penanda tetap bisa dikelola lewat
                daftar.
              </p>
            }
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="sm"
            variant={placing ? "secondary" : "primary"}
            onClick={() => setEditing(placing ? { kind: "none" } : { kind: "new", point: null })}
          >
            <Plus aria-hidden="true" strokeWidth={1.75} />
            {placing ? "Batal pilih titik" : "Tambah penanda"}
          </Button>
          <Checkbox
            label="Tampilkan yang sudah diperbaiki"
            checked={showResolved}
            onCheckedChange={setShowResolved}
          />
          {placing && model ? (
            <span className="text-body-sm text-text-muted">
              Klik permukaan model untuk menaruh titik.
            </span>
          ) : null}
        </div>
        <ConditionList
          conditions={visible}
          selectedId={selectedId}
          onEdit={(condition) => setEditing({ kind: "edit", id: condition.id })}
        />
      </div>

      <div className="flex flex-col gap-6">
        <ModelPanel
          key={model?.model_version ?? 0}
          car={car}
          onSaveCamera={model ? saveCamera : undefined}
        />
        {editing.kind === "new" || selected ? (
          <ConditionForm
            key={editing.kind === "new" ? "new" : selected?.id}
            carId={car.id}
            condition={editing.kind === "new" ? null : selected}
            point={editing.kind === "new" ? editing.point : null}
            hasModel={model !== null}
            onSaved={afterSave}
            onDeleted={() => {
              setEditing({ kind: "none" });
              void refresh();
            }}
            onMove={() => selected && setEditing({ kind: "move", id: selected.id })}
            onCancel={() => setEditing({ kind: "none" })}
          />
        ) : null}
      </div>

      <div className="lg:col-span-3">
        <InspectionLog car={car} />
      </div>
    </div>
  );
}
