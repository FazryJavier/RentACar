"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "info" | "warning" | "error";

export type ToastInput = { tone: ToastTone; title: string; message?: string };

type ToastItem = ToastInput & { id: number };

type ToastApi = { show: (toast: ToastInput) => void; dismiss: (id: number) => void };

const ToastContext = createContext<ToastApi | null>(null);

/** Auto-dismiss delay for non-error toasts. */
export const TOAST_DURATION_MS = 5000;

const toneStyles: Record<ToastTone, { border: string; icon: string; Icon: typeof Info }> = {
  success: { border: "border-l-success", icon: "text-success", Icon: CircleCheck },
  info: { border: "border-l-info", icon: "text-info", Icon: Info },
  warning: { border: "border-l-warning", icon: "text-warning", Icon: TriangleAlert },
  error: { border: "border-l-danger", icon: "text-danger", Icon: CircleAlert },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    setToasts((current) => [...current, { ...toast, id: nextId++ }]);
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      <ToastPrimitive.Provider swipeDirection="right" label="Notifikasi">
        {children}
        {toasts.map((toast) => {
          const { border, icon, Icon } = toneStyles[toast.tone];
          const isError = toast.tone === "error";

          return (
            <ToastPrimitive.Root
              key={toast.id}
              type={isError ? "foreground" : "background"}
              duration={isError ? Infinity : TOAST_DURATION_MS}
              onOpenChange={(open) => {
                if (!open) {
                  dismiss(toast.id);
                }
              }}
              role={isError ? "alert" : "status"}
              aria-live={isError ? "assertive" : "polite"}
              className={cn(
                "border-border bg-surface relative flex w-full gap-3 rounded-md border border-l-4 p-4 pr-12 shadow-lg",
                "motion-safe:data-[state=open]:animate-slide-in motion-reduce:data-[state=open]:animate-fade-in",
                border,
              )}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn("mt-0.5 size-5 shrink-0", icon)}
              />
              <div className="min-w-0">
                <ToastPrimitive.Title className="text-body-sm text-text font-semibold">
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.message ? (
                  <ToastPrimitive.Description className="text-body-sm text-text-muted mt-0.5">
                    {toast.message}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Tutup notifikasi"
                className="text-text-muted hover:bg-surface-muted focus-visible:focus-ring absolute top-2 right-2 inline-flex size-10 items-center justify-center rounded-full"
              >
                <X aria-hidden="true" strokeWidth={1.75} className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport
          className={cn(
            "max-w-toast fixed top-4 left-1/2 z-(--z-toast) flex w-full -translate-x-1/2 flex-col gap-3 px-4 outline-none",
            "md:right-4 md:left-auto md:translate-x-0 md:px-0",
          )}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

/** Show toasts from any client component under `<ToastProvider>`. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);

  if (!api) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }

  return api;
}
