/** Helpers for WIB (Asia/Jakarta, UTC+7, no daylight saving) calendar dates and times. */

export const WIB_TIME_ZONE = "Asia/Jakarta";
export const WIB_OFFSET = "+07:00";

/** A calendar date in WIB, `YYYY-MM-DD`. */
export type DateKey = string;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

const keyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WIB_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** WIB calendar date of an instant. */
export function toDateKey(date: Date): DateKey {
  return keyFormatter.format(date);
}

/** Instant at 12:00 WIB on the given date (safe anchor for calendar maths in any device zone). */
export function dateKeyToNoon(key: DateKey): Date {
  const match = DATE_KEY.exec(key);

  if (!match) {
    throw new RangeError(`Invalid date key: ${key}`);
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 5, 0, 0));
}

/** "2026-11-24" + "09:00" → "2026-11-24T09:00:00+07:00". */
export function toWibIso(key: DateKey, time: string): string {
  if (!DATE_KEY.test(key) || !TIME.test(time)) {
    throw new RangeError(`Invalid date/time: ${key} ${time}`);
  }

  return `${key}T${time}:00${WIB_OFFSET}`;
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: WIB_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-12-03T02:00:00Z" → { key: "2026-12-03", time: "09:00" } in WIB; null when invalid. */
export function fromIso(value: string | null | undefined): { key: DateKey; time: string } | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return { key: toDateKey(date), time: timeFormatter.format(date) };
}

function minutes(time: string): number {
  const match = TIME.exec(time);

  if (!match) {
    throw new RangeError(`Invalid time: ${time}`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

/** Time slots from `open` to `close` inclusive, every `step` minutes: ("08:00","20:00") → 08:00 … 20:00. */
export function buildTimeSlots(open: string, close: string, step = 30): string[] {
  const start = minutes(open);
  const end = minutes(close);

  if (end < start || step <= 0) {
    throw new RangeError("Closing time must not be before opening time.");
  }

  const first = Math.ceil(start / step) * step;
  const slots: string[] = [];

  for (let m = first; m <= end; m += step) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }

  return slots;
}
