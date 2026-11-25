"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const overlay =
  "fixed inset-0 z-(--z-dialog) bg-navy-900/60 motion-safe:data-[state=open]:animate-fade-in motion-reduce:data-[state=open]:animate-fade-in";

export type DialogContentProps = Omit<
  ComponentPropsWithRef<typeof DialogPrimitive.Content>,
  "title"
> & {
  title: ReactNode;
  description?: ReactNode;
  /** `confirm` 480px, `form` 720px. */
  size?: "confirm" | "form";
  closeLabel?: string;
};

/** Modal dialog: focus trapped, Esc closes, focus returns to the trigger. */
export function DialogContent({
  title,
  description,
  size = "confirm",
  closeLabel = "Tutup",
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlay} />
      <div className="pointer-events-none fixed inset-0 z-(--z-dialog) flex items-center justify-center p-4">
        <DialogPrimitive.Content
          {...props}
          aria-modal="true"
          aria-describedby={description ? undefined : props["aria-describedby"]}
          className={cn(
            "bg-surface pointer-events-auto relative flex max-h-full w-full flex-col overflow-y-auto rounded-lg p-6 shadow-lg",
            size === "confirm" ? "max-w-confirm" : "max-w-form",
            "motion-safe:data-[state=open]:animate-zoom-in motion-reduce:data-[state=open]:animate-fade-in",
            className,
          )}
        >
          <div className="pr-10">
            <DialogPrimitive.Title className="text-h4 text-text">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-body-sm text-text-muted mt-1.5">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <div className="mt-4">{children}</div>
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="text-text hover:bg-surface-muted focus-visible:focus-ring absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full"
          >
            <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

/** Footer: cancel (secondary) on the left, the action on the right. */
export function DialogFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between", className)}
    />
  );
}

export type BottomSheetContentProps = Omit<
  ComponentPropsWithRef<typeof DialogPrimitive.Content>,
  "title"
> & {
  title: ReactNode;
  description?: ReactNode;
};

/** Mobile bottom sheet: use with `<Dialog>`; same focus behaviour. */
export function BottomSheetContent({
  title,
  description,
  className,
  children,
  ...props
}: BottomSheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn(overlay, "z-(--z-sheet)")} />
      <DialogPrimitive.Content
        {...props}
        aria-modal="true"
        aria-describedby={description ? undefined : props["aria-describedby"]}
        className={cn(
          "max-h-sheet bg-surface fixed inset-x-0 bottom-0 z-(--z-sheet) flex flex-col overflow-y-auto rounded-t-xl px-6 pt-3 pb-6 shadow-lg",
          "motion-safe:data-[state=open]:animate-slide-up motion-reduce:data-[state=open]:animate-fade-in",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="bg-border-strong mx-auto mb-4 h-1 w-10 shrink-0 rounded-full"
        />
        <DialogPrimitive.Title className="text-h4 text-text">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="text-body-sm text-text-muted mt-1.5">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
