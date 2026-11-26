"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

type FormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Side panel for admin forms (right; full screen below 768px). Focus trapped, Esc closes. */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: FormSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-navy-900/60 motion-safe:animate-fade-in fixed inset-0 z-(--z-sheet)" />
        <DialogPrimitive.Content
          aria-modal="true"
          aria-describedby={description ? undefined : undefined}
          className="bg-surface motion-safe:animate-fade-in md:max-w-confirm fixed inset-y-0 right-0 z-(--z-sheet) flex w-full flex-col shadow-lg"
        >
          <div className="border-border flex items-start justify-between gap-4 border-b px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-h4 text-text">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-body-sm text-text-muted mt-1">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label="Tutup"
              className="text-text-muted hover:bg-surface-muted focus-visible:focus-ring -mr-2 inline-flex size-10 items-center justify-center rounded-full"
            >
              <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? (
            <div className="border-border flex justify-between gap-3 border-t px-6 py-4">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
