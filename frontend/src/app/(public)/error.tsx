"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ErrorContent } from "@/components/layout/error-content";
import { Button } from "@/components/ui";

export const ERROR_TITLE = "Terjadi kesalahan";
export const ERROR_MESSAGE = "Halaman ini gagal dimuat. Silakan coba lagi beberapa saat lagi.";

/** Error boundary for public pages: never shows error details to visitors. */
export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <ErrorContent
      icon={TriangleAlert}
      title={ERROR_TITLE}
      message={ERROR_MESSAGE}
      actions={
        <>
          <Button variant="secondary" onClick={() => retry()}>
            Coba lagi
          </Button>
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </>
      }
    />
  );
}
