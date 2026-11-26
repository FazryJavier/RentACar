"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field, FileDropzone, Input } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { brandsApi, type Brand } from "@/lib/admin-api";
import { ConfirmDialog } from "../crud/confirm-dialog";
import { DataTable } from "../crud/data-table";
import { FormSheet } from "../crud/form-sheet";
import { SaveAlertView } from "../crud/save-alert";
import { useSaveErrors } from "../crud/save-errors";
import { useCrudPage } from "../crud/use-crud-page";
import { formatUpdated } from "./format";

const LIST_KEY = "admin-brands";
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

const schema = z.object({
  name: z.string().trim().min(2, "Nama merek 2–60 karakter").max(60, "Nama merek 2–60 karakter"),
});
type Values = z.infer<typeof schema>;

const columns: ColumnDef<Brand, unknown>[] = [
  {
    id: "logo",
    header: "Logo",
    cell: ({ row }) =>
      row.original.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- small uploaded logos served from /storage
        <img src={row.original.logo_url} alt="" className="size-8 rounded-sm object-contain" />
      ) : (
        <span className="bg-surface-muted inline-block size-8 rounded-sm" aria-hidden="true" />
      ),
  },
  {
    accessorKey: "name",
    header: "Nama",
    meta: { sortKey: "name", sticky: true },
    cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => <span className="text-text-muted">{row.original.slug}</span>,
  },
  {
    id: "updated",
    header: "Diubah",
    meta: { sortKey: "updated_at" },
    cell: ({ row }) => formatUpdated(row.original.updated_at),
  },
];

function BrandForm({
  record,
  onDone,
}: {
  record: Brand | null;
  onDone: (message: string) => void;
}) {
  const [current, setCurrent] = useState(record);
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: record?.name ?? "" },
  });
  const { alert, setAlert, handle } = useSaveErrors(form.setError, ["name"]);

  const submit = form.handleSubmit(async (values) => {
    setAlert(null);
    try {
      let saved = current
        ? await brandsApi.update(current.id, { ...values, version: current.version })
        : await brandsApi.create(values);
      if (logo) {
        saved = await brandsApi.uploadLogo(saved.id, logo);
      } else if (removeLogo && saved.logo_url) {
        saved = await brandsApi.removeLogo(saved.id);
      }
      setCurrent(saved);
      onDone("Merek disimpan");
    } catch (error) {
      handle(error);
    }
  });

  async function reload() {
    if (!current) {
      return;
    }
    const latest = await brandsApi.get(current.id);
    setCurrent(latest);
    form.reset({ name: latest.name });
    setAlert(null);
  }

  return (
    <form id="brand-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
      <SaveAlertView alert={alert} onReload={reload} />
      <Field label="Nama merek" error={form.formState.errors.name?.message} required>
        <Input size="sm" {...form.register("name")} />
      </Field>
      <Field label="Logo">
        <div className="flex flex-col gap-3">
          {current?.logo_url && !removeLogo && !logo ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded logo preview */}
              <img
                src={current.logo_url}
                alt={`Logo ${current.name}`}
                className="border-border size-16 rounded-sm border object-contain"
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => setRemoveLogo(true)}>
                Hapus logo
              </Button>
            </div>
          ) : null}
          <FileDropzone
            accept={LOGO_TYPES}
            maxSize={1024 * 1024}
            typeLabel="JPG, PNG, WebP, atau SVG"
            onFileChange={setLogo}
          />
        </div>
      </Field>
    </form>
  );
}

export function BrandsPage() {
  const list = useAdminList<Brand>(LIST_KEY, (params, signal) => brandsApi.list(params, signal), {
    sort: "name",
  });
  const crud = useCrudPage<Brand>({
    listKey: LIST_KEY,
    remove: brandsApi.remove,
    deletedMessage: "Merek dihapus",
  });

  return (
    <div className="flex flex-col gap-6">
      <DataTable<Brand>
        columns={columns}
        list={list}
        searchLabel="Cari merek"
        createLabel="Tambah merek"
        onCreate={crud.openCreate}
        rowName={(row) => row.name}
        rowActions={() => [
          { label: "Ubah", onSelect: crud.openEdit },
          { label: "Hapus", onSelect: crud.askDelete, danger: true },
        ]}
        empty={{
          title: "Belum ada merek",
          description: "Tambahkan merek agar mobil bisa dikelompokkan.",
        }}
      />
      <FormSheet
        open={crud.sheet.open}
        onOpenChange={(open) => (open ? undefined : crud.closeSheet())}
        title={crud.sheet.record ? "Ubah merek" : "Tambah merek"}
        footer={
          <>
            <Button variant="secondary" onClick={crud.closeSheet}>
              Batal
            </Button>
            <Button type="submit" form="brand-form">
              Simpan
            </Button>
          </>
        }
      >
        {crud.sheet.open ? (
          <BrandForm
            key={crud.sheet.record?.id ?? "new"}
            record={crud.sheet.record}
            onDone={crud.afterSave}
          />
        ) : null}
      </FormSheet>
      <ConfirmDialog
        open={crud.deleting !== null}
        onOpenChange={(open) => (open ? undefined : crud.cancelDelete())}
        title="Hapus merek ini?"
        description={crud.deleting ? `Merek "${crud.deleting.name}" akan dihapus permanen.` : ""}
        loading={crud.deleteLoading}
        error={crud.deleteError}
        onConfirm={crud.confirmDelete}
      />
    </div>
  );
}
