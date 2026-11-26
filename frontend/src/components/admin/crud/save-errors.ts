"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { mapAdminError } from "@/lib/admin-api";

export type SaveAlert = { kind: "conflict" | "error"; message: string } | null;

/** Maps a failed save onto the form: field errors, version conflict, or a generic alert. */
export function useSaveErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const router = useRouter();
  const [alert, setAlert] = useState<SaveAlert>(null);

  function handle(error: unknown): void {
    const mapped = mapAdminError(error);
    switch (mapped.kind) {
      case "fields": {
        let focus = true;
        let mappedAny = false;
        for (const field of fields) {
          const message = mapped.fields[field];
          if (message) {
            setError(field, { type: "server", message }, { shouldFocus: focus });
            focus = false;
            mappedAny = true;
          }
        }
        setAlert(
          mappedAny
            ? null
            : { kind: "error", message: Object.values(mapped.fields)[0] ?? "Data tidak valid." },
        );
        return;
      }
      case "conflict":
        setAlert({ kind: "conflict", message: mapped.message });
        return;
      case "unauthenticated":
        router.push("/admin/masuk");
        return;
      default:
        setAlert({ kind: "error", message: mapped.message });
    }
  }

  return { alert, setAlert, handle };
}
