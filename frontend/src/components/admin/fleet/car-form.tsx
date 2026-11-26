"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type KeyboardEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button, Field, IconButton, Input, Select, Textarea, useToast } from "@/components/ui";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import {
  carsApi,
  mapAdminError,
  type BlockingBooking,
  type Car,
  type CarBody,
  type CarStatus,
  type FuelType,
  type Transmission,
} from "@/lib/admin-api";
import { formatRupiah } from "@/lib/format";
import { SaveAlertView } from "../crud/save-alert";
import { useSaveErrors } from "../crud/save-errors";
import { CAR_STATUS, FUEL_LABEL, TRANSMISSION_LABEL, options } from "./labels";
import { StatusGuardDialog } from "./status-guard-dialog";
import { useReferenceOptions } from "./use-reference-options";

const MAX_FEATURES = 12;

/** Current year in WIB (the server uses the same rule: up to next year). */
function wibYear(): number {
  return Number(
    new Intl.DateTimeFormat("en", { timeZone: "Asia/Jakarta", year: "numeric" }).format(new Date()),
  );
}

const optionalNumber = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : Number(value);

function buildSchema(requireBranch: boolean) {
  return z
    .object({
      brand_id: z.string().min(1, "Pilih merek"),
      category_id: z.string().min(1, "Pilih kategori"),
      branch_id: z.string(),
      model_name: z.string().trim().min(1, "Model 1–80 karakter").max(80, "Model 1–80 karakter"),
      // The upper bound (next year in WIB) is read at validation time, never during render.
      year: z.number({ message: "Isi tahun" }).superRefine((year, context) => {
        const maxYear = wibYear() + 1;
        if (!Number.isInteger(year) || year < 2000 || year > maxYear) {
          context.addIssue({ code: "custom", message: `Tahun 2000 s.d. ${maxYear}` });
        }
      }),
      plate_number: z
        .string()
        .trim()
        .regex(
          /^[A-Za-z]{1,2}\s*\d{1,4}\s*[A-Za-z]{0,3}$/,
          "Format plat nomor tidak valid (contoh B 1234 XYZ)",
        ),
      color: z.string().trim().min(2, "Warna 2–30 karakter").max(30, "Warna 2–30 karakter"),
      transmission: z.enum(["automatic", "manual"]),
      fuel_type: z.enum(["gasoline", "diesel", "hybrid", "electric"]),
      seats: z
        .number({ message: "Kursi 2–16" })
        .int("Kursi 2–16")
        .min(2, "Kursi 2–16")
        .max(16, "Kursi 2–16"),
      luggage_capacity: z
        .number()
        .int("Bagasi 0–20 koper")
        .min(0, "Bagasi 0–20 koper")
        .max(20, "Bagasi 0–20 koper")
        .nullable(),
      daily_price: z
        .number({ message: "Harga per hari Rp100.000–Rp10.000.000" })
        .int("Harga per hari Rp100.000–Rp10.000.000")
        .min(100000, "Harga per hari Rp100.000–Rp10.000.000")
        .max(10000000, "Harga per hari Rp100.000–Rp10.000.000"),
      deposit: z
        .number({ message: "Deposit Rp0–Rp10.000.000" })
        .int("Deposit Rp0–Rp10.000.000")
        .min(0, "Deposit Rp0–Rp10.000.000")
        .max(10000000, "Deposit Rp0–Rp10.000.000"),
      status: z.enum(["active", "maintenance", "inactive"]),
      description: z.string().trim().max(2000, "Deskripsi maksimal 2.000 karakter"),
      features: z.array(z.string()).max(MAX_FEATURES, `Maksimal ${MAX_FEATURES} fasilitas`),
    })
    .refine((values) => !requireBranch || values.branch_id !== "", {
      path: ["branch_id"],
      message: "Pilih cabang",
    });
}

type Values = z.infer<ReturnType<typeof buildSchema>>;

const FIELDS = [
  "brand_id",
  "category_id",
  "branch_id",
  "model_name",
  "year",
  "plate_number",
  "color",
  "transmission",
  "fuel_type",
  "seats",
  "luggage_capacity",
  "daily_price",
  "deposit",
  "status",
  "description",
  "features",
] as const;

function toValues(car: Car | null): Values {
  return {
    brand_id: car ? String(car.brand.id) : "",
    category_id: car ? String(car.category.id) : "",
    branch_id: car ? String(car.branch.id) : "",
    model_name: car?.model_name ?? "",
    // A new car gets the current year after mount (see CarForm), so render stays deterministic.
    year: car?.year ?? Number.NaN,
    plate_number: car?.plate_number ?? "",
    color: car?.color ?? "",
    transmission: car?.transmission ?? "automatic",
    fuel_type: car?.fuel_type ?? "gasoline",
    seats: car?.seats ?? 5,
    luggage_capacity: car?.luggage_capacity ?? null,
    daily_price: car?.daily_price ?? 300000,
    deposit: car?.deposit ?? 500000,
    status: car?.status ?? "active",
    description: car?.description ?? "",
    features: car?.features ?? [],
  };
}

function toBody(values: Values, includeBranch: boolean): CarBody {
  return {
    brand_id: Number(values.brand_id),
    category_id: Number(values.category_id),
    ...(includeBranch ? { branch_id: Number(values.branch_id) } : {}),
    model_name: values.model_name,
    year: values.year,
    plate_number: values.plate_number,
    color: values.color,
    transmission: values.transmission as Transmission,
    fuel_type: values.fuel_type as FuelType,
    seats: values.seats,
    luggage_capacity: values.luggage_capacity,
    daily_price: values.daily_price,
    deposit: values.deposit,
    status: values.status as CarStatus,
    description: values.description === "" ? null : values.description,
    features: values.features,
  };
}

type Guard = { bookings: BlockingBooking[]; message: string; body: CarBody };

/** Tab "Data" of the car editor: create (no car yet) or update with optimistic locking. */
export function CarForm({ car, onSaved }: { car: Car | null; onSaved: (car: Car) => void }) {
  const me = useCurrentAdmin();
  const toast = useToast();
  const isSuperAdmin = me.status === "signed-in" && me.admin.role === "super_admin";
  const staffBranch = me.status === "signed-in" ? me.admin.branch : null;
  const refs = useReferenceOptions({ branches: isSuperAdmin });
  const [current, setCurrent] = useState(car);
  const [featureDraft, setFeatureDraft] = useState("");
  const [guard, setGuard] = useState<Guard | null>(null);
  const [forcing, setForcing] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(buildSchema(isSuperAdmin)),
    defaultValues: toValues(car),
  });
  const { alert, setAlert, handle } = useSaveErrors(form.setError, FIELDS);
  const errors = form.formState.errors;

  useEffect(() => {
    if (car === null) {
      form.setValue("year", wibYear());
    }
  }, [car, form]);

  const [dailyPrice, deposit, features] = useWatch({
    control: form.control,
    name: ["daily_price", "deposit", "features"],
  });

  async function save(body: CarBody, force?: string) {
    const saved = current
      ? await carsApi.update(current.id, {
          ...body,
          version: current.version,
          ...(force ? { force_cancel_bookings: true, cancel_reason: force } : {}),
        })
      : await carsApi.create(body);
    setCurrent(saved);
    form.reset(toValues(saved));
    toast.show({ tone: "success", title: "Mobil disimpan" });
    onSaved(saved);
  }

  const submit = form.handleSubmit(async (values) => {
    setAlert(null);
    const body = toBody(values, isSuperAdmin);
    try {
      await save(body);
    } catch (error) {
      const mapped = mapAdminError(error);
      if (mapped.kind === "active-bookings") {
        setGuard({ bookings: mapped.bookings, message: mapped.message, body });
        return;
      }
      handle(error);
    }
  });

  async function forceSave(reason: string) {
    if (!guard) {
      return;
    }
    setForcing(true);
    try {
      await save(guard.body, reason);
      setGuard(null);
    } catch (error) {
      setGuard(null);
      handle(error);
    } finally {
      setForcing(false);
    }
  }

  async function reload() {
    if (!current) {
      return;
    }
    const latest = await carsApi.get(current.id);
    setCurrent(latest);
    form.reset(toValues(latest));
    setAlert(null);
  }

  function addFeature(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const value = featureDraft.trim().slice(0, 30);
    if (!value || features.length >= MAX_FEATURES) {
      return;
    }
    if (!features.some((feature) => feature.toLowerCase() === value.toLowerCase())) {
      form.setValue("features", [...features, value], { shouldDirty: true });
    }
    setFeatureDraft("");
  }

  const select = (
    name: "brand_id" | "category_id" | "branch_id" | "transmission" | "fuel_type" | "status",
    choices: { value: string; label: string }[],
    placeholder = "Pilih",
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
          name={field.name}
        />
      )}
    />
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      <SaveAlertView alert={alert} onReload={reload} />

      <section className="flex flex-col gap-5" aria-labelledby="car-identity">
        <h3 id="car-identity" className="text-h4 text-text">
          Identitas
        </h3>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Merek" error={errors.brand_id?.message} required>
            {select("brand_id", refs.brands, "Pilih merek")}
          </Field>
          <Field label="Model" error={errors.model_name?.message} required>
            <Input size="sm" {...form.register("model_name")} />
          </Field>
          <Field label="Tahun" error={errors.year?.message} required>
            <Input
              size="sm"
              type="number"
              inputMode="numeric"
              {...form.register("year", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Warna" error={errors.color?.message} required>
            <Input size="sm" {...form.register("color")} />
          </Field>
          <Field
            label="Plat nomor"
            help="Contoh B 1234 XYZ"
            error={errors.plate_number?.message}
            required
          >
            <Input size="sm" autoCapitalize="characters" {...form.register("plate_number")} />
          </Field>
          <Field label="Kategori" error={errors.category_id?.message} required>
            {select("category_id", refs.categories, "Pilih kategori")}
          </Field>
          {isSuperAdmin ? (
            <Field label="Cabang" error={errors.branch_id?.message} required>
              {select("branch_id", refs.branches, "Pilih cabang")}
            </Field>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm text-text font-medium">Cabang</span>
              <p className="text-body text-text">{staffBranch?.name ?? "—"}</p>
              <p className="text-caption text-text-subtle">Mobil selalu masuk cabang Anda.</p>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="car-spec">
        <h3 id="car-spec" className="text-h4 text-text">
          Spesifikasi
        </h3>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Transmisi" error={errors.transmission?.message} required>
            {select("transmission", options(TRANSMISSION_LABEL))}
          </Field>
          <Field label="Bahan bakar" error={errors.fuel_type?.message} required>
            {select("fuel_type", options(FUEL_LABEL))}
          </Field>
          <Field label="Kursi" error={errors.seats?.message} required>
            <Input
              size="sm"
              type="number"
              inputMode="numeric"
              {...form.register("seats", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Bagasi (koper)" help="Opsional" error={errors.luggage_capacity?.message}>
            <Input
              size="sm"
              type="number"
              inputMode="numeric"
              {...form.register("luggage_capacity", { setValueAs: optionalNumber })}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="car-price">
        <h3 id="car-price" className="text-h4 text-text">
          Harga & status
        </h3>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field
            label="Harga per hari (Rp)"
            help={Number.isFinite(dailyPrice) ? formatRupiah(dailyPrice) : undefined}
            error={errors.daily_price?.message}
            required
          >
            <Input
              size="sm"
              type="number"
              inputMode="numeric"
              step={1000}
              {...form.register("daily_price", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Deposit (Rp)"
            help={Number.isFinite(deposit) ? formatRupiah(deposit) : undefined}
            error={errors.deposit?.message}
            required
          >
            <Input
              size="sm"
              type="number"
              inputMode="numeric"
              step={1000}
              {...form.register("deposit", { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Status"
            help="Perawatan/Nonaktif tidak tampil di pencarian pelanggan."
            error={errors.status?.message}
            required
          >
            {select("status", options(CAR_STATUS))}
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="car-description">
        <h3 id="car-description" className="text-h4 text-text">
          Deskripsi & fasilitas
        </h3>
        <Field
          label="Deskripsi"
          help="Opsional, maksimal 2.000 karakter."
          error={errors.description?.message}
        >
          <Textarea size="sm" rows={4} {...form.register("description")} />
        </Field>
        <Field
          label="Fasilitas"
          help={`Ketik lalu tekan Enter (maksimal ${MAX_FEATURES}). Contoh: AC, Audio, USB.`}
          error={errors.features?.message}
        >
          <Input
            size="sm"
            value={featureDraft}
            onChange={(event) => setFeatureDraft(event.target.value)}
            onKeyDown={addFeature}
            disabled={features.length >= MAX_FEATURES}
          />
        </Field>
        {features.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Fasilitas terpilih">
            {features.map((feature) => (
              <li
                key={feature}
                className="bg-surface-muted text-body-sm text-text inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3"
              >
                {feature}
                <IconButton
                  variant="ghost"
                  className="size-7"
                  aria-label={`Hapus fasilitas ${feature}`}
                  onClick={() =>
                    form.setValue(
                      "features",
                      features.filter((item) => item !== feature),
                      { shouldDirty: true },
                    )
                  }
                >
                  <X aria-hidden="true" strokeWidth={1.75} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="border-border flex flex-wrap justify-end gap-3 border-t pt-6">
        <Link
          href="/admin/mobil"
          className="text-body-sm text-text-muted hover:text-text focus-visible:focus-ring self-center rounded-sm"
        >
          Kembali ke daftar
        </Link>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Simpan
        </Button>
      </div>

      <StatusGuardDialog
        open={guard !== null}
        bookings={guard?.bookings ?? []}
        message={guard?.message ?? ""}
        loading={forcing}
        onCancel={() => setGuard(null)}
        onConfirm={forceSave}
      />
    </form>
  );
}
