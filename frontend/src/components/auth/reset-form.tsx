"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Field, Input, useToast } from "@/components/ui";
import { apiPost, fieldErrors } from "@/lib/api";
import { resetSchema, type ResetValues } from "@/lib/validation/customer";
import { FormAlert } from "./form-alert";
import { TextLink } from "./text-link";
import { useApiFormErrors } from "./use-api-form";

export const INVALID_LINK_MESSAGE = "Tautan atur ulang tidak valid atau sudah kedaluwarsa.";

export function ResetForm() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });
  const { alert, setAlert, handle, retryIn } = useApiFormErrors(setError, [
    "password",
    "password_confirmation",
  ]);

  if (token === "" || email === "") {
    return (
      <div className="flex flex-col gap-5">
        <FormAlert alert={{ tone: "danger", message: INVALID_LINK_MESSAGE }} />
        <TextLink href="/lupa-kata-sandi">Minta tautan baru</TextLink>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      await apiPost<null>("/auth/reset-password", { ...values, token, email });
      toast.show({
        tone: "success",
        title: "Kata sandi diperbarui",
        message: "Silakan masuk dengan kata sandi baru.",
      });
      router.replace("/masuk");
    } catch (error) {
      // An invalid/expired token arrives as a field error on `token`, which has no input here.
      const tokenError = fieldErrors(error).token;
      if (tokenError) {
        setAlert({ tone: "danger", message: tokenError });
        return;
      }
      handle(error);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert alert={alert} />
      {alert?.message === INVALID_LINK_MESSAGE ? (
        <TextLink href="/lupa-kata-sandi">Minta tautan baru</TextLink>
      ) : null}
      <p className="text-body-sm text-text-muted">
        Akun: <span className="text-text font-semibold">{email}</span>
      </p>
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
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={retryIn > 0}>
        Simpan kata sandi
      </Button>
    </form>
  );
}
