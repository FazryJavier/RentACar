"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button, Field, Input, useToast } from "@/components/ui";

export const NEWSLETTER_ERROR = "Masukkan email yang valid";
export const NEWSLETTER_TOAST = "Simulasi — tidak ada email dikirim";

/** Simulated newsletter sign-up: validates the email locally, sends and stores nothing. */
export function NewsletterForm() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = inputRef.current;
    const value = email.trim();

    if (
      !input ||
      value === "" ||
      input.validity.typeMismatch ||
      !value.includes(".", value.indexOf("@"))
    ) {
      setError(NEWSLETTER_ERROR);
      input?.focus();
      return;
    }

    setError(null);
    setEmail("");
    toast.show({ tone: "info", title: NEWSLETTER_TOAST });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Email" error={error} tone="on-dark" help="Info promo dan armada baru (demo).">
        <Input
          ref={inputRef}
          type="email"
          autoComplete="email"
          placeholder="nama@contoh.test"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) {
              setError(null);
            }
          }}
        />
      </Field>
      <Button type="submit" variant="accent">
        Berlangganan
      </Button>
    </form>
  );
}
