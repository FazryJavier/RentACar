"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Field, Input, useToast } from "@/components/ui";
import { useSetCurrentCustomer, type CurrentCustomer } from "@/hooks/useCurrentCustomer";
import { apiPost } from "@/lib/api";
import { safeNextPath } from "@/lib/auth";
import { cleanPhone, registerSchema, type RegisterValues } from "@/lib/validation/customer";
import { FormAlert } from "./form-alert";
import { useApiFormErrors } from "./use-api-form";

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const next = safeNextPath(useSearchParams().get("next"));
  const setCustomer = useSetCurrentCustomer();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", password_confirmation: "" },
  });
  const { alert, setAlert, handle, retryIn } = useApiFormErrors(setError, [
    "name",
    "email",
    "phone",
    "password",
    "password_confirmation",
  ]);

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      const customer = await apiPost<CurrentCustomer>("/auth/register", {
        ...values,
        phone: cleanPhone(values.phone),
      });
      setCustomer(customer);
      toast.show({
        tone: "success",
        title: "Akun berhasil dibuat",
        message: "Selamat datang di RentACar (demo).",
      });
      router.replace(next);
    } catch (error) {
      handle(error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert alert={alert} />
      <Field label="Nama lengkap" error={errors.name?.message} required>
        <Input autoComplete="name" {...register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="No. HP" help="Contoh: 0812 3456 7890" error={errors.phone?.message} required>
        <Input type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      <Field
        label="Kata sandi"
        help="Minimal 8 karakter, berisi huruf dan angka."
        error={errors.password?.message}
        required
      >
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Konfirmasi kata sandi" error={errors.password_confirmation?.message} required>
        <Input type="password" autoComplete="new-password" {...register("password_confirmation")} />
      </Field>
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={retryIn > 0}>
        {retryIn > 0 ? `Coba lagi dalam ${retryIn} detik` : "Daftar"}
      </Button>
    </form>
  );
}
