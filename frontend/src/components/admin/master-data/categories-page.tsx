"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { categoriesApi, type Category } from "@/lib/admin-api";
import { ConfirmDialog } from "../crud/confirm-dialog";
import { DataTable } from "../crud/data-table";
import { FormSheet } from "../crud/form-sheet";
import { SaveAlertView } from "../crud/save-alert";
import { useSaveErrors } from "../crud/save-errors";
import { useCrudPage } from "../crud/use-crud-page";

const LIST_KEY = "admin-categories";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori 2–60 karakter")
    .max(60, "Nama kategori 2–60 karakter"),
  description: z.string().trim().max(255, "Deskripsi maksimal 255 karakter"),
  sort_order: z
    .number({ message: "Urutan harus angka 0–999" })
    .int("Urutan harus angka 0–999")
    .min(0, "Urutan harus angka 0–999")
    .max(999, "Urutan harus angka 0–999"),
});
type Values = z.infer<typeof schema>;

const columns: ColumnDef<Category, unknown>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    meta: { sortKey: "name", sticky: true },
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => <span className="text-text-muted">{row.original.description ?? "—"}</span>,
  },
  { accessorKey: "sort_order", header: "Urutan", meta: { sortKey: "sort_order", align: "right" } },
];

function toValues(record: Category | null): Values {
  return {
    name: record?.name ?? "",
    description: record?.description ?? "",
    sort_order: record?.sort_order ?? 0,
  };
}

function CategoryForm({
  record,
  onDone,
}: {
  record: Category | null;
  onDone: (message: string) => void;
}) {
  const [current, setCurrent] = useState(record);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(record) });
  const { alert, setAlert, handle } = useSaveErrors(form.setError, [
    "name",
    "description",
    "sort_order",
  ]);

  const submit = form.handleSubmit(async (values) => {
    setAlert(null);
    const body = { ...values, description: values.description === "" ? null : values.description };
    try {
      const saved = current
        ? await categoriesApi.update(current.id, { ...body, version: current.version })
        : await categoriesApi.create(body);
      setCurrent(saved);
      onDone("Kategori disimpan");
    } catch (error) {
      handle(error);
    }
  });

  async function reload() {
    if (!current) {
      return;
    }
    const latest = await categoriesApi.get(current.id);
    setCurrent(latest);
    form.reset(toValues(latest));
    setAlert(null);
  }

  return (
    <form id="category-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
      <SaveAlertView alert={alert} onReload={reload} />
      <Field label="Nama kategori" error={form.formState.errors.name?.message} required>
        <Input size="sm" {...form.register("name")} />
      </Field>
      <Field
        label="Deskripsi"
        help="Opsional, maksimal 255 karakter."
        error={form.formState.errors.description?.message}
      >
        <Textarea size="sm" rows={3} {...form.register("description")} />
      </Field>
      <Field
        label="Urutan"
        help="Urutan chip kategori di beranda (0–999)."
        error={form.formState.errors.sort_order?.message}
      >
        <Input
          size="sm"
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          {...form.register("sort_order", { valueAsNumber: true })}
        />
      </Field>
    </form>
  );
}

export function CategoriesPage() {
  const list = useAdminList<Category>(
    LIST_KEY,
    (params, signal) => categoriesApi.list(params, signal),
    { sort: "sort_order" },
  );
  const crud = useCrudPage<Category>({
    listKey: LIST_KEY,
    remove: categoriesApi.remove,
    deletedMessage: "Kategori dihapus",
  });

  return (
    <div className="flex flex-col gap-6">
      <DataTable<Category>
        columns={columns}
        list={list}
        searchLabel="Cari kategori"
        createLabel="Tambah kategori"
        onCreate={crud.openCreate}
        rowName={(row) => row.name}
        rowActions={() => [
          { label: "Ubah", onSelect: crud.openEdit },
          { label: "Hapus", onSelect: crud.askDelete, danger: true },
        ]}
        empty={{
          title: "Belum ada kategori",
          description: "Tambahkan kategori seperti SUV atau MPV.",
        }}
      />
      <FormSheet
        open={crud.sheet.open}
        onOpenChange={(open) => (open ? undefined : crud.closeSheet())}
        title={crud.sheet.record ? "Ubah kategori" : "Tambah kategori"}
        footer={
          <>
            <Button variant="secondary" onClick={crud.closeSheet}>
              Batal
            </Button>
            <Button type="submit" form="category-form">
              Simpan
            </Button>
          </>
        }
      >
        {crud.sheet.open ? (
          <CategoryForm
            key={crud.sheet.record?.id ?? "new"}
            record={crud.sheet.record}
            onDone={crud.afterSave}
          />
        ) : null}
      </FormSheet>
      <ConfirmDialog
        open={crud.deleting !== null}
        onOpenChange={(open) => (open ? undefined : crud.cancelDelete())}
        title="Hapus kategori ini?"
        description={crud.deleting ? `Kategori "${crud.deleting.name}" akan dihapus permanen.` : ""}
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
      />
    </div>
  );
}
