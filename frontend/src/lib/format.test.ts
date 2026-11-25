import { afterEach, describe, expect, it } from "vitest";
import {
  formatDateTimeWib,
  formatDateWib,
  formatFileSize,
  formatRupiah,
  formatTimeWib,
} from "./format";

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
});

describe("formatRupiah", () => {
  it("formats a typical amount without a space", () => {
    expect(formatRupiah(3900000)).toBe("Rp3.900.000");
  });

  it.each([
    [0, "Rp0"],
    [999, "Rp999"],
    [1000, "Rp1.000"],
    [Number.MAX_SAFE_INTEGER, "Rp9.007.199.254.740.991"],
  ])("formats %d as %s", (amount, expected) => {
    expect(formatRupiah(amount)).toBe(expected);
  });

  it("formats negative amounts", () => {
    expect(formatRupiah(-50000)).toBe("-Rp50.000");
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects %s", (amount) => {
    expect(() => formatRupiah(amount)).toThrow(RangeError);
  });
});

describe("WIB formatting", () => {
  it.each(["UTC", "America/New_York", "Asia/Jakarta"])(
    "converts UTC to WIB regardless of host zone %s",
    (zone) => {
      process.env.TZ = zone;

      expect(formatDateTimeWib("2026-11-24T07:30:00Z")).toBe("Sel, 24 Nov 2026 · 14.30 WIB");
      expect(formatDateWib(new Date("2026-11-24T07:30:00Z"))).toBe("Sel, 24 Nov 2026");
      expect(formatTimeWib("2026-11-24T07:30:00+00:00")).toBe("14.30 WIB");
    },
  );

  it("moves to the next WIB date after 17:00 UTC", () => {
    expect(formatDateWib("2026-11-24T17:30:00Z")).toBe("Rab, 25 Nov 2026");
    expect(formatDateWib("2026-11-24T16:59:59Z")).toBe("Sel, 24 Nov 2026");
  });

  it("shows midnight as 00.00", () => {
    expect(formatTimeWib("2026-11-24T17:00:00Z")).toBe("00.00 WIB");
  });

  it("rejects invalid dates", () => {
    expect(() => formatDateWib("not-a-date")).toThrow(RangeError);
    expect(() => formatTimeWib(new Date(Number.NaN))).toThrow(RangeError);
  });
});

describe("formatFileSize", () => {
  it.each([
    [0, "0 B"],
    [1023, "1023 B"],
    [2048, "2 KB"],
    [1024 * 1024, "1,0 MB"],
    [5 * 1024 * 1024, "5,0 MB"],
  ])("formats %d bytes as %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });

  it("rejects negative sizes", () => {
    expect(() => formatFileSize(-1)).toThrow(RangeError);
  });
});
