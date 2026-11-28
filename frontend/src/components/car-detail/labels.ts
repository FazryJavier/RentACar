import type { PublicAvailability } from "@/lib/public-api";

export const REASON_LABEL: Record<NonNullable<PublicAvailability["reason"]>, string> = {
  booked: "Sudah dipesan pada tanggal ini",
  other_branch: "Mobil ini hanya bisa disewa dari cabangnya",
  unavailable: "Mobil sedang tidak bisa disewa",
};

/** `2026-11-10` → `10 Nov 2026` (a date without time; no time-zone shift). */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
