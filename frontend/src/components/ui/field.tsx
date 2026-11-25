"use client";

import { CircleAlert } from "lucide-react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldContextValue = {
  controlId: string;
  labelId: string;
  invalid: boolean;
  describedBy: string | undefined;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/** ARIA wiring for a control rendered inside `<Field>`; empty outside a Field. */
export function useFieldControl(): Partial<{
  id: string;
  "aria-invalid": true;
  "aria-describedby": string;
  "aria-required": true;
}> {
  const field = useContext(FieldContext);

  if (!field) {
    return {};
  }

  return {
    id: field.controlId,
    ...(field.invalid ? { "aria-invalid": true as const } : {}),
    ...(field.describedBy ? { "aria-describedby": field.describedBy } : {}),
    ...(field.required ? { "aria-required": true as const } : {}),
  };
}

/** Label id of the surrounding Field, for controls labelled with `aria-labelledby` (radio groups). */
export function useFieldLabelId(): string | undefined {
  return useContext(FieldContext)?.labelId;
}

export type FieldProps = {
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** `on-dark` for fields placed on navy surfaces (footer). */
  tone?: "default" | "on-dark";
  className?: string;
  children: ReactNode;
};

/**
 * Form field wrapper: label above, help text below, error with icon.
 * Controls inside receive `id`, `aria-invalid` and `aria-describedby` through context.
 */
export function Field({
  label,
  help,
  error,
  required = false,
  tone = "default",
  className,
  children,
}: FieldProps) {
  const onDark = tone === "on-dark";
  const baseId = useId();
  const controlId = `${baseId}-control`;
  const labelId = `${baseId}-label`;
  const helpId = help ? `${baseId}-help` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider
      value={{ controlId, labelId, invalid: Boolean(error), describedBy, required }}
    >
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          id={labelId}
          htmlFor={controlId}
          className={cn("text-body-sm font-medium", onDark ? "text-text-on-dark" : "text-text")}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className={onDark ? "text-danger-bg" : "text-danger"}>
              {" "}
              *
            </span>
          ) : null}
        </label>
        {children}
        {error ? (
          <p
            id={errorId}
            className={cn(
              "text-body-sm flex items-center gap-1.5",
              onDark ? "text-danger-bg" : "text-danger",
            )}
          >
            <CircleAlert aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
            {error}
          </p>
        ) : null}
        {help ? (
          <p
            id={helpId}
            className={cn("text-caption", onDark ? "text-text-on-dark-muted" : "text-text-subtle")}
          >
            {help}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
