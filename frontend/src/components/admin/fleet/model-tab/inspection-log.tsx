"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Textarea, useToast } from "@/components/ui";
import { inspectionsApi, mapAdminError, type Car } from "@/lib/admin-api";
import { formatDateTimeWib } from "@/lib/format";
import { carQueryKey } from "../photo-manager";
import { nowWibLocal } from "./labels";

export function inspectionsKey(carId: number) {
  return ["admin-car-inspections", carId] as const;
}

/** Inspection records (time in WIB, kilometres, notes), newest first. */
export function InspectionLog({ car }: { car: Car }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: inspectionsKey(car.id),
    queryFn: ({ signal }) => inspectionsApi.list(car.id, signal),
  });
  const [at, setAt] = useState("");
  const [km, setKm] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- default "now" is read after mount
    setAt(nowWibLocal());
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at)) {
      next.inspected_at = "Isi waktu inspeksi";
    } else if (at > nowWibLocal()) {
      next.inspected_at = "Waktu inspeksi tidak boleh di masa depan";
    }
    const odometer = Number(km);
    if (km.trim() === "" || !Number.isInteger(odometer) || odometer < 0 || odometer > 2_000_000) {
      next.odometer_km = "Kilometer 0–2.000.000";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    setBusy(true);
    try {
      await inspectionsApi.create(car.id, {
        // The datetime-local value is WIB.
        inspected_at: `${at}:00+07:00`,
        odometer_km: odometer,
        notes: notes.trim() === "" ? null : notes.trim(),
      });
      toast.show({ tone: "success", title: "Inspeksi dicatat" });
      setKm("");
      setNotes("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inspectionsKey(car.id) }),
        queryClient.invalidateQueries({ queryKey: carQueryKey(car.id) }),
      ]);
    } catch (error) {
      const mapped = mapAdminError(error);
      setErrors(mapped.kind === "fields" ? mapped.fields : { inspected_at: mapped.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="inspection-log"
      className="border-border flex flex-col gap-4 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id="inspection-log" className="text-h4 text-text">
          Inspeksi
        </h3>
        <p className="text-body-sm text-text-muted">
          Terakhir: {car.last_inspected_at ? formatDateTimeWib(car.last_inspected_at) : "belum ada"}
        </p>
      </div>
      <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Waktu inspeksi" help="WIB" error={errors.inspected_at} required>
          <Input
            size="sm"
            type="datetime-local"
            value={at}
            onChange={(event) => setAt(event.target.value)}
          />
        </Field>
        <Field label="Kilometer" error={errors.odometer_km} required>
          <Input
            size="sm"
            type="number"
            inputMode="numeric"
            value={km}
            onChange={(event) => setKm(event.target.value)}
          />
        </Field>
        <Field
          label="Catatan"
          help="Opsional, maksimal 1.000 karakter"
          error={errors.notes}
          className="sm:col-span-2"
        >
          <Textarea
            size="sm"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" size="sm" loading={busy}>
            Catat inspeksi
          </Button>
        </div>
      </form>
      {query.data && query.data.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Riwayat inspeksi">
          {query.data.map((inspection) => (
            <li
              key={inspection.id}
              className="border-border text-body-sm flex flex-col gap-1 border-t pt-2"
            >
              <span className="text-text font-semibold">
                {formatDateTimeWib(inspection.inspected_at)} ·{" "}
                {inspection.odometer_km.toLocaleString("id-ID")} km
              </span>
              {inspection.notes ? (
                <span className="text-text-muted">{inspection.notes}</span>
              ) : null}
              {inspection.admin ? (
                <span className="text-caption text-text-subtle">oleh {inspection.admin.name}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
