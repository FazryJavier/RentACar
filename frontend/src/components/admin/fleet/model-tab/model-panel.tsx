"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import { Button, Checkbox, Field, Input, useToast } from "@/components/ui";
import { carModelApi, mapAdminError, type Car, type ModelCredit } from "@/lib/admin-api";
import { ConfirmDialog } from "../../crud/confirm-dialog";
import { carQueryKey } from "../photo-manager";
import { formatFileSize } from "@/lib/format";

const MAX_BYTES = 15 * 1024 * 1024;

function creditOf(car: Car): ModelCredit {
  return {
    source_name: car.model_3d?.source_name ?? "",
    source_url: car.model_3d?.source_url ?? "",
    license: car.model_3d?.license ?? "",
    is_illustrative: car.model_3d?.is_illustrative ?? false,
  };
}

/**
 * Upload/replace the .glb with source and licence (required), the "illustrative" flag, saving
 * the camera (with a poster), and deleting the model.
 */
export function ModelPanel({
  car,
  onSaveCamera,
}: {
  car: Car;
  onSaveCamera?: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const model = car.model_3d;
  const [file, setFile] = useState<File | null>(null);
  const [credit, setCredit] = useState<ModelCredit>(creditOf(car));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingCamera, setSavingCamera] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: carQueryKey(car.id) }),
      queryClient.invalidateQueries({ queryKey: ["admin-car-conditions", car.id] }),
    ]);

  function validate(requireFile: boolean): Record<string, string> {
    const next: Record<string, string> = {};
    if (requireFile && !file) {
      next.file = "Pilih file model .glb";
    } else if (file && (file.size > MAX_BYTES || !file.name.toLowerCase().endsWith(".glb"))) {
      next.file = "Unggah file .glb (glTF 2.0) maksimal 15 MB";
    }
    if (credit.source_name.trim().length < 2) {
      next.source_name = "Isi sumber model";
    }
    if (credit.license.trim().length < 2) {
      next.license = "Isi lisensi model";
    }
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = validate(!model || file !== null);
    setErrors(next);
    setAlert(null);
    if (Object.keys(next).length > 0) {
      return;
    }
    setBusy(true);
    try {
      if (file) {
        await carModelApi.upload(car.id, file, credit);
        setFile(null);
        toast.show({ tone: "success", title: model ? "Model 3D diganti" : "Model 3D diunggah" });
      } else {
        await carModelApi.update(car.id, credit);
        toast.show({ tone: "success", title: "Data model disimpan" });
      }
      await refresh();
    } catch (error) {
      const mapped = mapAdminError(error);
      if (mapped.kind === "fields") {
        setErrors(mapped.fields);
      } else {
        setAlert(mapped.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveCamera() {
    if (!onSaveCamera) {
      return;
    }
    setSavingCamera(true);
    try {
      await onSaveCamera();
      toast.show({ tone: "success", title: "Sudut kamera disimpan" });
      await refresh();
    } catch {
      toast.show({ tone: "error", title: "Sudut kamera gagal disimpan" });
    } finally {
      setSavingCamera(false);
    }
  }

  async function confirmDelete() {
    setDeleteError(null);
    try {
      await carModelApi.remove(car.id);
      setDeleting(false);
      toast.show({ tone: "success", title: "Model 3D dihapus" });
      await refresh();
    } catch (error) {
      const mapped = mapAdminError(error);
      setDeleteError("message" in mapped ? mapped.message : "Model gagal dihapus.");
    }
  }

  return (
    <section
      aria-labelledby="model-panel"
      className="border-border flex flex-col gap-4 rounded-lg border p-4"
    >
      <h3 id="model-panel" className="text-h4 text-text">
        Model
      </h3>
      {model ? (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-text">
            Model versi {model.model_version} · {formatFileSize(model.file_size)}
            {model.poster_url ? " · poster tersimpan" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {onSaveCamera ? (
              <Button
                size="sm"
                variant="secondary"
                loading={savingCamera}
                onClick={() => void saveCamera()}
              >
                Simpan sudut kamera
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDeleteError(null);
                setDeleting(true);
              }}
            >
              Hapus model
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-body-sm text-text-muted">
          Belum ada model 3D. Unggah file .glb (glTF 2.0, maksimal 15 MB, tekstur tertanam).
        </p>
      )}

      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        {alert ? <FormAlert alert={{ tone: "danger", message: alert }} /> : null}
        <Field
          label={model ? "Ganti file model (opsional)" : "File model .glb"}
          help="glTF biner 2.0, maksimal 15 MB"
          error={errors.file}
          required={!model}
        >
          <Input
            size="sm"
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </Field>
        <Field
          label="Sumber model"
          help="Nama pembuat atau situs"
          error={errors.source_name}
          required
        >
          <Input
            size="sm"
            value={credit.source_name}
            onChange={(event) => setCredit({ ...credit, source_name: event.target.value })}
          />
        </Field>
        <Field label="URL sumber" help="Opsional" error={errors.source_url}>
          <Input
            size="sm"
            type="url"
            value={credit.source_url ?? ""}
            onChange={(event) => setCredit({ ...credit, source_url: event.target.value })}
          />
        </Field>
        <Field label="Lisensi" help="Contoh CC-BY-4.0" error={errors.license} required>
          <Input
            size="sm"
            value={credit.license}
            onChange={(event) => setCredit({ ...credit, license: event.target.value })}
          />
        </Field>
        <Checkbox
          label='Model tidak sama persis dengan unit (tampil sebagai "Model ilustrasi")'
          checked={credit.is_illustrative}
          onCheckedChange={(checked) => setCredit({ ...credit, is_illustrative: checked })}
        />
        <div>
          <Button type="submit" size="sm" loading={busy}>
            {model ? (file ? "Ganti model" : "Simpan data model") : "Unggah model"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Hapus model 3D?"
        description="File model dan poster dihapus. Penanda tetap ada dan perlu dipindahkan setelah model baru diunggah."
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
