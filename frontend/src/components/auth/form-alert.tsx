import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { FormAlert as FormAlertValue } from "./use-api-form";

const STYLES = {
  danger: { box: "bg-danger-bg text-danger", Icon: CircleAlert },
  warning: { box: "bg-warning-bg text-warning", Icon: TriangleAlert },
  success: { box: "bg-success-bg text-success", Icon: CircleCheck },
  info: { box: "bg-info-bg text-info", Icon: Info },
} as const;

/** Form-level message (non-field errors, confirmations). */
export function FormAlert({ alert }: { alert: FormAlertValue }) {
  if (!alert) {
    return null;
  }

  const { box, Icon } = STYLES[alert.tone];

  return (
    <div
      role={alert.tone === "danger" || alert.tone === "warning" ? "alert" : "status"}
      className={cn("text-body-sm flex items-start gap-2 rounded-md px-4 py-3", box)}
    >
      <Icon aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
      <p>{alert.message}</p>
    </div>
  );
}
