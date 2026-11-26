import { formatDateWib } from "@/lib/format";

export function formatUpdated(iso: string): string {
  return formatDateWib(iso);
}

/** "07:00"–"21:00" → "07.00–21.00 WIB". */
export function formatHours(opening: string, closing: string): string {
  return `${opening.replace(":", ".")}–${closing.replace(":", ".")} WIB`;
}
