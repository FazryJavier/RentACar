"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Field, Input } from "@/components/ui";
import { apiPost } from "@/lib/api";
import { forgotSchema, type ForgotValues } from "@/lib/validation/customer";
import { FormAlert } from "./form-alert";
import { TextLink } from "./text-link";
import { useApiFormErrors } from "./use-api-form";

/** The confirmation never depends on whether the email exists. */
export const FORGOT_CONFIRMATION = "Jika email terdaftar, tautan atur ulang telah dikirim.";

export function ForgotForm() {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  const { alert, setAlert, handle, retryIn } = useApiFormErrors(setError, ["email"]);

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await apiPost<null>("/auth/forgot-password", values);
      setSent(FORGOT_CONFIRMATION);
    } catch (error) {
      handle(error);
    }
  });

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert alert={{ tone: "success", message: sent }} />
        <p className="text-body-sm text-text-muted">
          Periksa kotak masuk email Anda. Tautan berlaku 60 menit dan hanya bisa dipakai sekali.
        </p>
        <TextLink href="/masuk">Kembali ke halaman masuk</TextLink>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert alert={alert} />
      <Field label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={retryIn > 0}>
        {retryIn > 0 ? `Coba lagi dalam ${retryIn} detik` : "Kirim tautan"}
      </Button>
    </form>
  );
}
