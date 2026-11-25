"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Textarea, useToast } from "@/components/ui";
import { useSetCurrentCustomer, type CurrentCustomer } from "@/hooks/useCurrentCustomer";
import { apiPatch, apiPut } from "@/lib/api";
import {
  changePasswordSchema,
  cleanPhone,
  profileSchema,
  type ChangePasswordValues,
  type ProfileValues,
} from "@/lib/validation/customer";
import { FormAlert } from "./form-alert";
import { useApiFormErrors } from "./use-api-form";

export function ProfileForm({ customer }: { customer: CurrentCustomer }) {
  const toast = useToast();
  const setCustomer = useSetCurrentCustomer();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address ?? "",
      license_number: customer.license_number ?? "",
    },
  });
  const { alert, setAlert, handle } = useApiFormErrors(setError, [
    "name",
    "phone",
    "address",
    "license_number",
  ]);

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      const updated = await apiPatch<CurrentCustomer>("/me", {
        ...values,
        phone: cleanPhone(values.phone),
        license_number: values.license_number.toUpperCase(),
      });
      setCustomer(updated);
      reset({
        name: updated.name,
        phone: updated.phone,
        address: updated.address ?? "",
        license_number: updated.license_number ?? "",
      });
      toast.show({ tone: "success", title: "Profil disimpan" });
    } catch (error) {
      handle(error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert alert={alert} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nama lengkap" error={errors.name?.message} required>
          <Input autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" help="Email tidak bisa diubah.">
          <Input type="email" value={customer.email} readOnly disabled />
        </Field>
        <Field label="No. HP" error={errors.phone?.message} required>
          <Input type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />
        </Field>
        <Field
          label="Nomor SIM"
          help="12–16 huruf/angka. Wajib sebelum memesan."
          error={errors.license_number?.message}
        >
          <Input autoComplete="off" {...register("license_number")} />
        </Field>
      </div>
      <Field label="Alamat" error={errors.address?.message}>
        <Textarea rows={3} autoComplete="street-address" {...register("address")} />
      </Field>
      <div>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Simpan profil
        </Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });
  const { alert, setAlert, handle } = useApiFormErrors(setError, [
    "current_password",
    "password",
    "password_confirmation",
  ]);

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await apiPut<null>("/me/password", values);
      reset();
      toast.show({
        tone: "success",
        title: "Kata sandi diubah",
        message: "Sesi di perangkat lain sudah dikeluarkan.",
      });
    } catch (error) {
      handle(error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="max-w-confirm flex flex-col gap-5">
      <FormAlert alert={alert} />
      <Field label="Kata sandi lama" error={errors.current_password?.message} required>
        <Input type="password" autoComplete="current-password" {...register("current_password")} />
      </Field>
      <Field
        label="Kata sandi baru"
        help="Minimal 8 karakter, berisi huruf dan angka."
        error={errors.password?.message}
        required
      >
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field
        label="Konfirmasi kata sandi baru"
        error={errors.password_confirmation?.message}
        required
      >
        <Input type="password" autoComplete="new-password" {...register("password_confirmation")} />
      </Field>
      <div>
        <Button type="submit" loading={isSubmitting}>
          Ubah kata sandi
        </Button>
      </div>
    </form>
  );
}
