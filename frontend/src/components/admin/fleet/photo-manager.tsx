"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";
import { Badge, Field, FileDropzone, IconButton, Spinner, useToast } from "@/components/ui";
import { carPhotosApi, mapAdminError, type Car, type CarPhoto } from "@/lib/admin-api";
import { ConfirmDialog } from "../crud/confirm-dialog";

export const MAX_PHOTOS = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;
/** Stop showing a spinner-only state after this long; the worker may not be running. */
const SLOW_PROCESSING_MS = 60_000;

type Upload = {
  id: number;
  name: string;
  state: "waiting" | "uploading" | "error";
  message?: string;
};

export function carQueryKey(id: number) {
  return ["admin-car", id] as const;
}

/** Tab "Foto": upload (max 5), processing state, reorder (drag or buttons) and delete. */
export function PhotoManager({ car }: { car: Car }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pendingOrder, setPendingOrder] = useState<CarPhoto[] | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<CarPhoto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const photos = pendingOrder ?? car.photos;
  const processing = car.photos.some((photo) => photo.processing);
  const busy = uploads.some((upload) => upload.state !== "error");

  useEffect(() => {
    if (!processing) {
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), SLOW_PROCESSING_MS);
    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [processing]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: carQueryKey(car.id) });

  async function uploadAll(files: File[]) {
    const batch = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      state: "waiting" as const,
    }));
    setUploads((current) => [...current.filter((upload) => upload.state !== "error"), ...batch]);
    const update = (id: number, changes: Partial<Upload> | null) =>
      setUploads((current) =>
        changes === null
          ? current.filter((upload) => upload.id !== id)
          : current.map((upload) => (upload.id === id ? { ...upload, ...changes } : upload)),
      );

    let count = car.photos.length;
    for (const [index, file] of files.entries()) {
      const item = batch[index]!;
      if (count >= MAX_PHOTOS) {
        update(item.id, { state: "error", message: `Maksimal ${MAX_PHOTOS} foto` });
        continue;
      }
      update(item.id, { state: "uploading" });
      try {
        await carPhotosApi.upload(car.id, file);
        count += 1;
        update(item.id, null);
        await refresh();
      } catch (error) {
        const mapped = mapAdminError(error);
        const message =
          mapped.kind === "fields"
            ? (mapped.fields.photo ?? Object.values(mapped.fields)[0])
            : mapped.message;
        update(item.id, { state: "error", message });
      }
    }
  }

  async function saveOrder(next: CarPhoto[], message: string) {
    setPendingOrder(next);
    setAnnouncement(message);
    try {
      const saved = await carPhotosApi.reorder(
        car.id,
        next.map((photo) => photo.id),
      );
      queryClient.setQueryData<Car>(carQueryKey(car.id), (current) =>
        current ? { ...current, photos: saved } : current,
      );
    } catch {
      toast.show({ tone: "error", title: "Urutan foto gagal disimpan" });
      setAnnouncement("Urutan foto gagal disimpan.");
      await refresh();
    } finally {
      setPendingOrder(null);
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) {
      return;
    }
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    void saveOrder(
      next,
      `Foto ${from + 1} dipindah ke posisi ${to + 1}${to === 0 ? " (foto utama)" : ""}.`,
    );
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, target: number) {
    event.preventDefault();
    const from = photos.findIndex((photo) => photo.id === dragged);
    setDragged(null);
    if (from >= 0) {
      move(from, target);
    }
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await carPhotosApi.remove(car.id, deleting.id);
      setDeleting(null);
      setAnnouncement("Foto dihapus.");
      toast.show({ tone: "success", title: "Foto dihapus" });
      await refresh();
    } catch (error) {
      const mapped = mapAdminError(error);
      setDeleteError("message" in mapped ? mapped.message : "Foto gagal dihapus.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <Field
        label="Tambah foto"
        help={`${car.photos.length}/${MAX_PHOTOS} foto. Foto pertama menjadi foto utama. Metadata lokasi dihapus otomatis.`}
      >
        <FileDropzone
          multiple
          accept={PHOTO_TYPES}
          maxSize={MAX_SIZE}
          typeLabel="JPG, PNG, atau WebP"
          onFilesChange={(files) => void uploadAll(files)}
          disabled={car.photos.length >= MAX_PHOTOS || busy}
        />
      </Field>

      {uploads.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Unggahan">
          {uploads.map((upload) => (
            <li key={upload.id} className="text-body-sm flex items-center gap-2">
              {upload.state === "error" ? (
                <span role="alert" className="text-danger">
                  {upload.name}: {upload.message}
                </span>
              ) : (
                <>
                  <Spinner className="size-4" />
                  <span className="text-text-muted">
                    {upload.name} — {upload.state === "uploading" ? "Mengunggah…" : "Menunggu…"}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {photos.length === 0 ? (
        <p className="text-body-sm text-text-muted">Belum ada foto.</p>
      ) : (
        <ol
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          aria-label="Foto mobil"
        >
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              draggable
              onDragStart={() => setDragged(photo.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={() => setDragged(null)}
              className={`border-border bg-surface flex flex-col gap-2 rounded-md border p-2 ${dragged === photo.id ? "opacity-40" : ""}`}
            >
              <div className="bg-surface-muted relative flex h-28 items-center justify-center overflow-hidden rounded-sm">
                {photo.urls ? (
                  // eslint-disable-next-line @next/next/no-img-element -- processed WebP from /storage
                  <img
                    src={photo.urls["480"]}
                    alt={photo.alt_text}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-caption text-text-muted flex flex-col items-center gap-1 text-center">
                    <Spinner className="size-5" />
                    {slow ? "Masih diproses. Muat ulang nanti." : "Memproses…"}
                  </span>
                )}
                {index === 0 ? (
                  <Badge tone="accent-solid" className="absolute top-2 left-2">
                    Utama
                  </Badge>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <IconButton
                  variant="ghost"
                  aria-label={`Geser ke kiri: foto ${index + 1}`}
                  disabled={index === 0 || pendingOrder !== null}
                  onClick={() => move(index, index - 1)}
                >
                  <ChevronLeft aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  aria-label={`Hapus foto ${index + 1}`}
                  onClick={() => {
                    setDeleteError(null);
                    setDeleting(photo);
                  }}
                >
                  <Trash2 aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  variant="ghost"
                  aria-label={`Geser ke kanan: foto ${index + 1}`}
                  disabled={index === photos.length - 1 || pendingOrder !== null}
                  onClick={() => move(index, index + 1)}
                >
                  <ChevronRight aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title="Hapus foto ini?"
        description="Foto akan dihapus permanen dari mobil ini."
        loading={deleteLoading}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
