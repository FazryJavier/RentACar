const WIB_TIME_ZONE = "Asia/Jakarta";

const rupiahNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

const wibDateParts = new Intl.DateTimeFormat("id-ID", {
  timeZone: WIB_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const wibTimeParts = new Intl.DateTimeFormat("id-ID", {
  timeZone: WIB_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Formats whole Rupiah: 3900000 → "Rp3.900.000", -50000 → "-Rp50.000". */
export function formatRupiah(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError("Rupiah amount must be a safe integer.");
  }

  const digits = rupiahNumber.format(Math.abs(amount));

  return amount < 0 ? `-Rp${digits}` : `Rp${digits}`;
}

function toDate(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date value.");
  }

  return date;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const found = parts.find((p) => p.type === type)?.value;

  if (found === undefined) {
    throw new RangeError(`Missing date part: ${type}`);
  }

  return found.replace(/\.$/, "");
}

/** WIB calendar date: "Sel, 24 Nov 2026". */
export function formatDateWib(value: string | Date): string {
  const parts = wibDateParts.formatToParts(toDate(value));

  return `${part(parts, "weekday")}, ${part(parts, "day")} ${part(parts, "month")} ${part(parts, "year")}`;
}

/** WIB time: "14.30 WIB". */
export function formatTimeWib(value: string | Date): string {
  const parts = wibTimeParts.formatToParts(toDate(value));

  return `${part(parts, "hour")}.${part(parts, "minute")} WIB`;
}

/** WIB date and time: "Sel, 24 Nov 2026 · 14.30 WIB". */
export function formatDateTimeWib(value: string | Date): string {
  return `${formatDateWib(value)} · ${formatTimeWib(value)}`;
}

/** File size for UI hints: 1048576 → "1,0 MB", 2048 → "2 KB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    throw new RangeError("File size must be a non-negative integer.");
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  const mb = bytes / (1024 * 1024);

  return `${new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mb)} MB`;
}
