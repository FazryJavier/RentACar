"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FormAlert } from "@/components/auth/form-alert";
import {
  Button,
  Checkbox,
  Field,
  FileDropzone,
  IconButton,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  conditionsApi,
  mapAdminError,
  type CarCondition,
  type ConditionArea,
  type ConditionBody,
  type ConditionSeverity,
  type Vec3,
} from "@/lib/admin-api";
import { ConfirmDialog } from "../../crud/confirm-dialog";
import { options } from "../labels";
import { AREA_LABEL, SEVERITY, todayWib } from "./labels";

const MAX_PHOTOS = 3;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const schema = z.object({
  area: z.string().min(1, "Pilih area"),
  severity: z.string().min(1, "Pilih tingkat kerusakan"),
  description: z
    .string()
    .trim()
    .min(5, "Deskripsi 5–300 karakter")
    .max(300, "Deskripsi 5–300 karakter"),
  // The upper bound (today in WIB) is checked at validation time, not during render.
  inspected_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Isi tanggal inspeksi")
    .refine((value) => value <= todayWib(), "Tanggal inspeksi tidak boleh di masa depan"),
  is_resolved: z.boolean(),
});
type Values = z.infer<typeof schema>;

export type DraftPoint = { position: Vec3; normal: Vec3 };

/**
 * Create or edit one marker. A new marker on a car with a model carries the clicked point;
 * without a model only the area is chosen.
 */
export function ConditionForm({
  carId,
  condition,
  point,
  hasModel,
  onSaved,
  onDeleted,
  onMove,
  onCancel,
}: {
  carId: number;
  condition: CarCondition | null;
  point: DraftPoint | null;
  hasModel: boolean;
  onSaved: (condition: CarCondition) => void;
  onDeleted: () => void;
  onMove: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [alert, setAlert] = useState<string | null>(null);
  const [photos, setPhotos] = useState(condition?.photos ?? []);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      area: condition?.area ?? "",
      severity: condition?.severity ?? "",
      description: condition?.description ?? "",
      inspected_on: condition?.inspected_on ?? "",
      is_resolved: condition?.is_resolved ?? false,
    },
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (!condition) {
      form.setValue("inspected_on", todayWib());
    }
  }, [condition, form]);

  const submit = form.handleSubmit(async (values) => {
    setAlert(null);
    const body: ConditionBody = {
      area: values.area as ConditionArea,
      severity: values.severity as ConditionSeverity,
      description: values.description,
      inspected_on: values.inspected_on,
    };
    try {
      let saved: CarCondition;
      if (condition) {
        saved = await conditionsApi.update(carId, condition.id, {
          ...body,
          is_resolved: values.is_resolved,
        });
      } else {
        if (hasModel && !point) {
          setAlert("Klik titik pada model");
          return;
        }
        saved = await conditionsApi.create(carId, point ? { ...body, ...point } : body);
      }
      toast.show({ tone: "success", title: "Penanda disimpan" });
      onSaved(saved);
    } catch (error) {
      const mapped = mapAdminError(error);
      if (mapped.kind === "fields") {
        for (const [field, message] of Object.entries(mapped.fields)) {
          if (field in values) {
            form.setError(field as keyof Values, { type: "server", message });
          } else {
            setAlert(message);
          }
        }
      } else {
        setAlert(mapped.message);
      }
    }
  });

  async function uploadPhotos(files: File[]) {
    if (!condition) {
      return;
    }
    setUploading(true);
    setPhotoError(null);
    let count = photos.length;
    try {
      for (const file of files) {
        if (count >= MAX_PHOTOS) {
          setPhotoError(`Maksimal ${MAX_PHOTOS} foto`);
          break;
        }
        const saved = await conditionsApi.uploadPhoto(carId, condition.id, file);
        setPhotos(saved.photos);
        count = saved.photos.length;
      }
    } catch (error) {
      const mapped = mapAdminError(error);
      setPhotoError(
        mapped.kind === "fields"
          ? (Object.values(mapped.fields)[0] ?? "Foto gagal diunggah")
          : mapped.message,
      );
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(photoId: number) {
    if (!condition) {
      return;
    }
    const saved = await conditionsApi.removePhoto(carId, condition.id, photoId);
    setPhotos(saved.photos);
  }

  async function confirmDelete() {
    if (!condition) {
      return;
    }
    await conditionsApi.remove(carId, condition.id);
    setDeleting(false);
    toast.show({ tone: "success", title: "Penanda dihapus" });
    onDeleted();
  }

  const select = (
    name: "area" | "severity",
    choices: { value: string; label: string }[],
    placeholder: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Select
          size="sm"
          options={choices}
          value={field.value === "" ? undefined : field.value}
          onValueChange={field.onChange}
          placeholder={placeholder}
        />
      )}
    />
  );

  return (
    <section
      aria-labelledby="condition-form"
      className="border-border flex flex-col gap-4 rounded-lg border p-4"
    >
      <h3 id="condition-form" className="text-h4 text-text">
        {condition ? `Penanda ${condition.number}` : "Penanda baru"}
      </h3>
      {!condition && hasModel ? (
        <p className="text-body-sm text-text-muted">
          {point ? "Titik dipilih di model." : "Klik titik pada model untuk menaruh penanda."}
        </p>
      ) : null}
      {condition?.needs_reposition ? (
        <FormAlert
          alert={{ tone: "warning", message: "Model sudah diganti. Pindahkan titik penanda ini." }}
        />
      ) : null}
      {alert ? <FormAlert alert={{ tone: "danger", message: alert }} /> : null}
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4">
          <Field label="Area" error={errors.area?.message} required>
            {select("area", options(AREA_LABEL), "Pilih area")}
          </Field>
          <Field label="Tingkat" error={errors.severity?.message} required>
            {select("severity", options(SEVERITY), "Pilih tingkat")}
          </Field>
        </div>
        <Field label="Deskripsi" help="5–300 karakter" error={errors.description?.message} required>
          <Textarea size="sm" rows={3} {...form.register("description")} />
        </Field>
        <Field
          label="Tanggal inspeksi"
          help="WIB, tidak boleh di masa depan"
          error={errors.inspected_on?.message}
          required
        >
          <Input size="sm" type="date" {...form.register("inspected_on")} />
        </Field>
        {condition ? (
          <Controller
            control={form.control}
            name="is_resolved"
            render={({ field }) => (
              <Checkbox
                label="Sudah diperbaiki"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" loading={form.formState.isSubmitting}>
            Simpan
          </Button>
          {condition && hasModel ? (
            <Button type="button" size="sm" variant="secondary" onClick={onMove}>
              Pindahkan titik
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Tutup
          </Button>
          {condition ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => setDeleting(true)}>
              Hapus penanda
            </Button>
          ) : null}
        </div>
      </form>

      {condition ? (
        <Field
          label="Foto kondisi"
          help={`${photos.length}/${MAX_PHOTOS} foto, JPG/PNG/WebP maksimal 2 MB`}
          error={photoError ?? undefined}
        >
          <div className="flex flex-col gap-3">
            {photos.length > 0 ? (
              <ul className="flex flex-wrap gap-3" aria-label="Foto penanda">
                {photos.map((photo, index) => (
                  <li key={photo.id} className="flex flex-col items-center gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- processed WebP from /storage */}
                    <img
                      src={photo.url}
                      alt={`Foto kondisi ${index + 1}`}
                      className="size-20 rounded-sm object-cover"
                    />
                    <IconButton
                      variant="ghost"
                      aria-label={`Hapus foto kondisi ${index + 1}`}
                      onClick={() => void removePhoto(photo.id)}
                    >
                      <Trash2 aria-hidden="true" strokeWidth={1.75} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            ) : null}
            <FileDropzone
              multiple
              accept={PHOTO_TYPES}
              maxSize={2 * 1024 * 1024}
              typeLabel="JPG, PNG, atau WebP"
              onFilesChange={(files) => void uploadPhotos(files)}
              disabled={uploading || photos.length >= MAX_PHOTOS}
            />
          </div>
        </Field>
      ) : (
        <p className="text-caption text-text-subtle">
          Foto kondisi bisa ditambahkan setelah penanda disimpan.
        </p>
      )}

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Hapus penanda ini?"
        description='Penanda dan fotonya dihapus. Untuk kerusakan yang sudah diperbaiki, gunakan "Sudah diperbaiki" agar riwayat tetap ada.'
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
