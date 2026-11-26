import type { BadgeTone } from "@/components/ui";
import type { ConditionArea, ConditionSeverity } from "@/lib/admin-api";

export const AREA_LABEL: Record<ConditionArea, string> = {
  front: "Depan",
  rear: "Belakang",
  left: "Kiri",
  right: "Kanan",
  roof: "Atap",
  interior: "Interior",
  wheel: "Roda",
};

export const SEVERITY: Record<ConditionSeverity, { label: string; tone: BadgeTone }> = {
  minor: { label: "Ringan", tone: "success" },
  moderate: { label: "Sedang", tone: "warning" },
  major: { label: "Berat", tone: "danger" },
};

/** Today in WIB as `YYYY-MM-DD` (call after mount, not during render). */
export function todayWib(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** Now in WIB as a `datetime-local` value (`YYYY-MM-DDTHH:mm`). */
export function nowWibLocal(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
