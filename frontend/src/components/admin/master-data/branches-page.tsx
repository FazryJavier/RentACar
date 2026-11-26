"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Badge, Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { branchesApi, type Branch } from "@/lib/admin-api";
import { ConfirmDialog } from "../crud/confirm-dialog";
import { DataTable } from "../crud/data-table";
import { FormSheet } from "../crud/form-sheet";
import { SaveAlertView } from "../crud/save-alert";
import { useSaveErrors } from "../crud/save-errors";
import { useCrudPage } from "../crud/use-crud-page";
import { BranchMapPicker, DEFAULT_POSITION } from "./branch-map-picker";
import { formatHours } from "./format";

const LIST_KEY = "admin-branches";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const coordinate = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine(
      (text) =>
        text !== "" && Number.isFinite(Number(text)) && Number(text) >= min && Number(text) <= max,
      message,
    );

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama cabang 2–100 karakter")
      .max(100, "Nama cabang 2–100 karakter"),
    address: z.string().trim().min(5, "Alamat 5–255 karakter").max(255, "Alamat 5–255 karakter"),
    city: z.string().trim().min(2, "Kota 2–60 karakter").max(60, "Kota 2–60 karakter"),
    phone: z
      .string()
      .trim()
      .refine(
        (text) => /^\d{8,15}$/.test(text.replace(/^\+/, "").replace(/[\s-]/g, "")),
        "Nomor telepon 8–15 digit",
      ),
    opening_time: z.string().regex(TIME, "Format jam HH:MM"),
    closing_time: z.string().regex(TIME, "Format jam HH:MM"),
    latitude: coordinate(-90, 90, "Latitude antara -90 dan 90"),
    longitude: coordinate(-180, 180, "Longitude antara -180 dan 180"),
    is_active: z.boolean(),
  })
  .refine((values) => values.closing_time > values.opening_time, {
    path: ["closing_time"],
    message: "Jam tutup harus setelah jam buka",
  });
type Values = z.infer<typeof schema>;

const FIELDS = [
  "name",
  "address",
  "city",
  "phone",
  "opening_time",
  "closing_time",
  "latitude",
  "longitude",
  "is_active",
] as const;

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "1", label: "Aktif" },
  { value: "0", label: "Nonaktif" },
];

const columns: ColumnDef<Branch, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    meta: { sortKey: "name", sticky: true },
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  { accessorKey: "city", header: "Kota", meta: { sortKey: "city" } },
  {
    id: "hours",
    header: "Jam operasional",
    cell: ({ row }) => formatHours(row.original.opening_time, row.original.closing_time),
  },
  { accessorKey: "phone", header: "Telepon" },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.is_active ? (
        <Badge tone="success">Aktif</Badge>
      ) : (
        <Badge tone="neutral">Nonaktif</Badge>
      ),
  },
];

function toValues(record: Branch | null): Values {
  return {
    name: record?.name ?? "",
    address: record?.address ?? "",
    city: record?.city ?? "",
    phone: record?.phone ?? "",
    opening_time: record?.opening_time ?? "07:00",
    closing_time: record?.closing_time ?? "21:00",
    latitude: record?.latitude ?? DEFAULT_POSITION.lat.toFixed(6),
    longitude: record?.longitude ?? DEFAULT_POSITION.lng.toFixed(6),
    is_active: record?.is_active ?? true,
  };
}

function BranchForm({
  record,
  onDone,
}: {
  record: Branch | null;
  onDone: (message: string) => void;
}) {
  const [current, setCurrent] = useState(record);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(record) });
  const { alert, setAlert, handle } = useSaveErrors(form.setError, FIELDS);
  const errors = form.formState.errors;
  const [latitude, longitude] = useWatch({
    control: form.control,
    name: ["latitude", "longitude"],
  });

  const submit = form.handleSubmit(async (values) => {
    setAlert(null);
    const body = {
      ...values,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
    };
    try {
      const saved = current
        ? await branchesApi.update(current.id, { ...body, version: current.version })
        : await branchesApi.create(body);
      setCurrent(saved);
      onDone("Cabang disimpan");
    } catch (error) {
      handle(error);
    }
  });

  async function reload() {
    if (!current) {
      return;
    }
    const latest = await branchesApi.get(current.id);
    setCurrent(latest);
    form.reset(toValues(latest));
    setAlert(null);
  }

  return (
    <form id="branch-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
      <SaveAlertView alert={alert} onReload={reload} />
      <Field label="Nama cabang" error={errors.name?.message} required>
        <Input size="sm" {...form.register("name")} />
      </Field>
      <Field label="Alamat" error={errors.address?.message} required>
        <Textarea size="sm" rows={2} {...form.register("address")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kota" error={errors.city?.message} required>
          <Input size="sm" {...form.register("city")} />
        </Field>
        <Field
          label="Telepon"
          help="Contoh 0217890123 atau +62217890123."
          error={errors.phone?.message}
          required
        >
          <Input size="sm" type="tel" inputMode="tel" {...form.register("phone")} />
        </Field>
        <Field label="Jam buka" help="WIB" error={errors.opening_time?.message} required>
          <Input size="sm" type="time" step={60} {...form.register("opening_time")} />
        </Field>
        <Field label="Jam tutup" help="WIB" error={errors.closing_time?.message} required>
          <Input size="sm" type="time" step={60} {...form.register("closing_time")} />
        </Field>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-body-sm text-text mb-2 font-semibold">Lokasi</legend>
        <BranchMapPicker
          latitude={latitude}
          longitude={longitude}
          onChange={({ latitude, longitude }) => {
            form.setValue("latitude", latitude, {
              shouldDirty: true,
              shouldValidate: form.formState.isSubmitted,
            });
            form.setValue("longitude", longitude, {
              shouldDirty: true,
              shouldValidate: form.formState.isSubmitted,
            });
          }}
          errors={{ latitude: errors.latitude?.message, longitude: errors.longitude?.message }}
        />
      </fieldset>
      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <Checkbox
            label="Cabang aktif (tampil sebagai pilihan lokasi)"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </form>
  );
}

function BranchDetail({ branch }: { branch: Branch }) {
  const rows: [string, string][] = [
    ["Alamat", branch.address],
    ["Kota", branch.city],
    ["Telepon", branch.phone],
    ["Jam operasional", formatHours(branch.opening_time, branch.closing_time)],
    ["Koordinat", `${branch.latitude}, ${branch.longitude}`],
    ["Status", branch.is_active ? "Aktif" : "Nonaktif"],
  ];
  return (
    <dl className="grid gap-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-body-sm text-text-muted">{label}</dt>
          <dd className="text-body text-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BranchesPage() {
  const me = useCurrentAdmin();
  const canEdit = me.status === "signed-in" && me.admin.role === "super_admin";
  const list = useAdminList<Branch>(
    LIST_KEY,
    (params, signal) => branchesApi.list(params, signal),
    { sort: "name" },
  );
  const crud = useCrudPage<Branch>({
    listKey: LIST_KEY,
    remove: branchesApi.remove,
    deletedMessage: "Cabang dihapus",
  });
  const [viewing, setViewing] = useState<Branch | null>(null);
  const [cityDraft, setCityDraft] = useState<string | null>(null);
  const city = cityDraft ?? list.filters.city ?? "";

  const filters = (
    <>
      <Field label="Status">
        <Select
          size="sm"
          options={STATUS_OPTIONS}
          value={list.filters.is_active ?? "all"}
          onValueChange={(value) =>
            list.setParams({ "filter[is_active]": value === "all" ? null : value })
          }
        />
      </Field>
      <Field label="Kota">
        <Input
          size="sm"
          value={city}
          onChange={(event) => setCityDraft(event.target.value)}
          onBlur={() => {
            list.setParams({ "filter[city]": city.trim() || null });
            setCityDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </Field>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <DataTable<Branch>
        columns={columns}
        list={list}
        searchLabel="Cari cabang"
        filters={filters}
        createLabel="Tambah cabang"
        onCreate={canEdit ? crud.openCreate : undefined}
        rowName={(row) => row.name}
        rowActions={
          canEdit
            ? () => [
                { label: "Ubah", onSelect: crud.openEdit },
                { label: "Hapus", onSelect: crud.askDelete, danger: true },
              ]
            : () => [{ label: "Lihat detail", onSelect: setViewing }]
        }
        empty={{
          title: "Belum ada cabang",
          description: canEdit
            ? "Tambahkan cabang pertama."
            : "Belum ada cabang yang bisa ditampilkan.",
        }}
      />
      <FormSheet
        open={crud.sheet.open}
        onOpenChange={(open) => (open ? undefined : crud.closeSheet())}
        title={crud.sheet.record ? "Ubah cabang" : "Tambah cabang"}
        footer={
          <>
            <Button variant="secondary" onClick={crud.closeSheet}>
              Batal
            </Button>
            <Button type="submit" form="branch-form">
              Simpan
            </Button>
          </>
        }
      >
        {crud.sheet.open ? (
          <BranchForm
            key={crud.sheet.record?.id ?? "new"}
            record={crud.sheet.record}
            onDone={crud.afterSave}
          />
        ) : null}
      </FormSheet>
      <FormSheet
        open={viewing !== null}
        onOpenChange={(open) => (open ? undefined : setViewing(null))}
        title={viewing?.name ?? "Detail cabang"}
        description="Hanya Super Admin yang dapat mengubah data cabang."
        footer={
          <Button variant="secondary" onClick={() => setViewing(null)}>
            Tutup
          </Button>
        }
      >
        {viewing ? <BranchDetail branch={viewing} /> : null}
      </FormSheet>
      <ConfirmDialog
        open={crud.deleting !== null}
        onOpenChange={(open) => (open ? undefined : crud.cancelDelete())}
        title="Hapus cabang ini?"
        description={crud.deleting ? `Cabang "${crud.deleting.name}" akan dihapus permanen.` : ""}
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
      />
    </div>
  );
}
