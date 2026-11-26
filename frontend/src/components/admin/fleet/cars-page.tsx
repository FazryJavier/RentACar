"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Box, ImageOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge, Field, Select } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { carsApi, type CarListItem } from "@/lib/admin-api";
import { formatRupiah } from "@/lib/format";
import { ConfirmDialog } from "../crud/confirm-dialog";
import { DataTable } from "../crud/data-table";
import { useCrudPage } from "../crud/use-crud-page";
import { CAR_STATUS, carName, options } from "./labels";
import { useReferenceOptions } from "./use-reference-options";

const LIST_KEY = "admin-cars";
const ALL = "all";

const columns: ColumnDef<CarListItem, unknown>[] = [
  {
    id: "photo",
    header: "Foto",
    cell: ({ row }) =>
      row.original.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- processed WebP thumbnails from /storage
        <img
          src={row.original.thumbnail_url}
          alt=""
          className="h-10 w-14 rounded-sm object-cover"
        />
      ) : (
        <span className="bg-surface-muted text-text-subtle inline-flex h-10 w-14 items-center justify-center rounded-sm">
          <ImageOff aria-hidden="true" strokeWidth={1.75} className="size-4" />
        </span>
      ),
  },
  {
    id: "name",
    header: "Nama",
    meta: { sortKey: "model_name", sticky: true },
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2 font-semibold">
        {carName(row.original)}
        {row.original.has_3d ? (
          <Box aria-label="Punya model 3D" strokeWidth={1.75} className="text-accent size-4" />
        ) : null}
      </span>
    ),
  },
  {
    accessorKey: "plate_number",
    header: "Plat",
    cell: ({ row }) => <span className="whitespace-nowrap">{row.original.plate_number}</span>,
  },
  { id: "category", header: "Kategori", cell: ({ row }) => row.original.category.name },
  { id: "branch", header: "Cabang", cell: ({ row }) => row.original.branch.name },
  {
    id: "price",
    header: "Harga/hari",
    meta: { sortKey: "daily_price", align: "right" },
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{formatRupiah(row.original.daily_price)}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = CAR_STATUS[row.original.status];
      return <Badge tone={status.tone}>{status.label}</Badge>;
    },
  },
];

export function CarsPage() {
  const router = useRouter();
  const me = useCurrentAdmin();
  const isSuperAdmin = me.status === "signed-in" && me.admin.role === "super_admin";
  const refs = useReferenceOptions({ branches: isSuperAdmin });
  const list = useAdminList<CarListItem>(
    LIST_KEY,
    (params, signal) => carsApi.list(params, signal),
    {
      sort: "-created_at",
    },
  );
  const crud = useCrudPage<CarListItem>({
    listKey: LIST_KEY,
    remove: carsApi.remove,
    deletedMessage: "Mobil dihapus",
  });

  const filter = (key: string, label: string, choices: { value: string; label: string }[]) => (
    <Field label={label}>
      <Select
        size="sm"
        options={[{ value: ALL, label: `Semua ${label.toLowerCase()}` }, ...choices]}
        value={list.filters[key] ?? ALL}
        onValueChange={(value) =>
          list.setParams({ [`filter[${key}]`]: value === ALL ? null : value })
        }
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-6">
      <DataTable<CarListItem>
        columns={columns}
        list={list}
        searchLabel="Cari model, plat, atau merek"
        filters={
          <>
            {filter("status", "Status", options(CAR_STATUS))}
            {filter("category_id", "Kategori", refs.categories)}
            {isSuperAdmin ? filter("branch_id", "Cabang", refs.branches) : null}
          </>
        }
        createLabel="Tambah mobil"
        onCreate={() => router.push("/admin/mobil/baru")}
        rowName={(row) => carName(row)}
        rowActions={() => [
          { label: "Ubah", onSelect: (row) => router.push(`/admin/mobil/${row.id}`) },
          { label: "Hapus", onSelect: crud.askDelete, danger: true },
        ]}
        empty={{
          title: "Belum ada mobil",
          description: "Tambahkan mobil pertama agar armada tampil di website.",
        }}
      />
      <ConfirmDialog
        open={crud.deleting !== null}
        onOpenChange={(open) => (open ? undefined : crud.cancelDelete())}
        title="Hapus mobil ini?"
        description={
          crud.deleting
            ? `${carName(crud.deleting)} (${crud.deleting.plate_number}) akan dihapus dari armada. Riwayat pemesanannya tetap ada.`
            : ""
        }
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
      />
    </div>
  );
}
