"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { ApiError, apiPost } from "@/lib/api";
import { safeNextPath } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/validation/customer";
import { AUDIENCES, useAudienceSetter, type Audience } from "./audience";
import { FormAlert } from "./form-alert";
import { useApiFormErrors } from "./use-api-form";

export function LoginForm({ audience = "customer" }: { audience?: Audience }) {
  const config = AUDIENCES[audience];
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"), config.within);
  const setSession = useAudienceSetter(audience);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });
  const { alert, setAlert, handle, retryIn } = useApiFormErrors(setError, ["email", "password"]);

  const onSubmit = handleSubmit(async (values) => {
    setAlert(null);
    try {
      const account = await apiPost<unknown>(`${config.api}/login`, values);
      setSession(account);
      router.replace(next);
    } catch (error) {
      handle(error);
      if (error instanceof ApiError && error.status === 401) {
        setValue("password", "");
        setFocus("password");
      }
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert alert={alert} />
      <Field label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Kata sandi" error={errors.password?.message} required>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      <Checkbox
        label="Ingat saya di perangkat ini"
        onCheckedChange={(checked) => setValue("remember", checked)}
      />
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={retryIn > 0}>
        {retryIn > 0 ? `Coba lagi dalam ${retryIn} detik` : "Masuk"}
      </Button>
    </form>
  );
}
