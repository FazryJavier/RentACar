"use client";

import { useEffect } from "react";
import "./globals.css";

/** Fallback when the root layout itself fails: renders its own document, no error details. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="id">
      <body>
        <title>Terjadi kesalahan — RentACar</title>
        <main className="max-w-page mx-auto flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-h1 text-text">Terjadi kesalahan</h1>
          <p className="text-body-lg text-text-muted max-w-confirm">
            Halaman ini gagal dimuat. Silakan coba lagi beberapa saat lagi.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="control-border border-navy-900 text-body text-text bg-surface focus-visible:focus-ring h-12 rounded-full px-6 font-semibold"
            >
              Coba lagi
            </button>
            {/* A full reload is intended here: the app shell itself failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="text-body bg-navy-900 text-text-on-dark focus-visible:focus-ring inline-flex h-12 items-center rounded-full px-6 font-semibold"
            >
              Kembali ke Beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
