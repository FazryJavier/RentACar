"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui";
import { mapAdminError } from "@/lib/admin-api";

/**
 * Open/close state for the form sheet and the delete dialog of one admin list, plus the
 * delete flow (toast, list refetch, "in use" message kept in the dialog).
 */
export function useCrudPage<T extends { id: number }>(options: {
  listKey: string;
  remove: (id: number) => Promise<unknown>;
  deletedMessage: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [sheet, setSheet] = useState<{ open: boolean; record: T | null }>({
    open: false,
    record: null,
  });
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await options.remove(deleting.id);
      setDeleting(null);
      toast.show({ tone: "success", title: options.deletedMessage });
      await queryClient.invalidateQueries({ queryKey: [options.listKey] });
    } catch (error) {
      const mapped = mapAdminError(error);
      if (mapped.kind === "unauthenticated") {
        router.push("/admin/masuk");
        return;
      }
      setDeleteError("message" in mapped ? mapped.message : "Data gagal dihapus.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return {
    sheet,
    openCreate: () => setSheet({ open: true, record: null }),
    openEdit: (record: T) => setSheet({ open: true, record }),
    closeSheet: () => setSheet((current) => ({ ...current, open: false })),
    afterSave: async (message: string) => {
      setSheet((current) => ({ ...current, open: false }));
      toast.show({ tone: "success", title: message });
      await queryClient.invalidateQueries({ queryKey: [options.listKey] });
    },
    deleting,
    askDelete: (record: T) => {
      setDeleteError(null);
      setDeleting(record);
    },
    cancelDelete: () => setDeleting(null),
    confirmDelete,
    deleteError,
    deleteLoading,
  };
}
