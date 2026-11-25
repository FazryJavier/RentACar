"use client";

import { useEffect, useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, fieldErrors } from "@/lib/api";

export type FormAlert = { tone: "danger" | "warning" | "success" | "info"; message: string } | null;

/**
 * Turns API failures into form state: field errors go to the matching fields, everything else
 * to a form-level alert. 429 disables submitting until `Retry-After` has passed.
 */
export function useApiFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const [alert, setAlert] = useState<FormAlert>(null);
  const [retryIn, setRetryIn] = useState(0);

  useEffect(() => {
    if (retryIn <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setRetryIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  function handle(error: unknown): void {
    if (!(error instanceof ApiError)) {
      setAlert({
        tone: "danger",
        message: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
      });
      return;
    }

    if (error.status === 429) {
      const seconds = error.retryAfter ?? 60;
      setRetryIn(seconds);
      setAlert({
        tone: "warning",
        message: `Terlalu banyak percobaan. Coba lagi dalam ${seconds} detik.`,
      });
      return;
    }

    const byField = fieldErrors(error);
    let mapped = false;
    for (const field of fields) {
      const message = byField[field];
      if (message) {
        setError(field, { type: "server", message }, { shouldFocus: !mapped });
        mapped = true;
      }
    }

    if (!mapped) {
      setAlert({ tone: "danger", message: error.message });
    } else {
      setAlert(null);
    }
  }

  return { alert, setAlert, handle, retryIn };
}
