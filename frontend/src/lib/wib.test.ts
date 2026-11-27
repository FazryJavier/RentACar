import { afterEach, describe, expect, it } from "vitest";
import { buildTimeSlots, dateKeyToNoon, fromIso, toDateKey, toWibIso } from "./wib";

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
});

describe("buildTimeSlots", () => {
  it("returns 25 slots from 08:00 to 20:00 inclusive", () => {
    const slots = buildTimeSlots("08:00", "20:00");

    expect(slots).toHaveLength(25);
    expect(slots[0]).toBe("08:00");
    expect(slots[1]).toBe("08:30");
    expect(slots.at(-1)).toBe("20:00");
  });

  it("starts at the next half hour when opening is not aligned", () => {
    expect(buildTimeSlots("08:15", "09:30")).toEqual(["08:30", "09:00", "09:30"]);
  });

  it("rejects invalid ranges and times", () => {
    expect(() => buildTimeSlots("20:00", "08:00")).toThrow(RangeError);
    expect(() => buildTimeSlots("8:00", "20:00")).toThrow(RangeError);
    expect(() => buildTimeSlots("08:00", "24:00")).toThrow(RangeError);
  });
});

describe("WIB date keys", () => {
  it.each(["UTC", "America/New_York", "Pacific/Kiritimati"])(
    "round-trips a date key in host zone %s",
    (zone) => {
      process.env.TZ = zone;

      expect(toDateKey(dateKeyToNoon("2026-11-24"))).toBe("2026-11-24");
      expect(toDateKey(new Date("2026-11-24T17:00:00Z"))).toBe("2026-11-25");
    },
  );

  it("builds ISO strings with the WIB offset", () => {
    expect(toWibIso("2026-11-24", "09:00")).toBe("2026-11-24T09:00:00+07:00");
    expect(() => toWibIso("2026-11-24", "9:00")).toThrow(RangeError);
    expect(() => dateKeyToNoon("24-11-2026")).toThrow(RangeError);
  });
});

describe("fromIso", () => {
  it("returns the WIB date and time of an instant", () => {
    expect(fromIso("2026-12-03T02:00:00Z")).toEqual({ key: "2026-12-03", time: "09:00" });
    expect(fromIso("2026-12-03T23:30:00+07:00")).toEqual({ key: "2026-12-03", time: "23:30" });
    expect(fromIso("2026-12-03T17:30:00Z")).toEqual({ key: "2026-12-04", time: "00:30" });
  });

  it("returns null for missing or invalid values", () => {
    expect(fromIso(null)).toBeNull();
    expect(fromIso("besok")).toBeNull();
  });
});
