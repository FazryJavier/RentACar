import { describe, expect, it } from "vitest";
import { activeMenuItem, menuFor, PLACEHOLDER_SECTIONS } from "./admin-menu";

describe("admin menu", () => {
  it("keeps server order and ignores unknown keys", () => {
    expect(menuFor(["cars", "dashboard", "future_module"]).map((item) => item.label)).toEqual([
      "Dashboard",
      "Mobil",
    ]);
  });

  it.each([
    ["/admin", "Dashboard"],
    ["/admin/mobil", "Mobil"],
    ["/admin/mobil/12", "Mobil"],
    ["/admin/log-audit", "Log Audit"],
    ["/admin/profil", undefined],
  ])("marks %s as %s", (path, label) => {
    expect(activeMenuItem(path)?.label).toBe(label);
  });

  it("lists placeholder sections for every module", () => {
    expect(PLACEHOLDER_SECTIONS).toMatchObject({
      pelanggan: "customers",
      "log-audit": "audit_logs",
    });
    expect(Object.keys(PLACEHOLDER_SECTIONS)).not.toContain("cabang");
    expect(Object.keys(PLACEHOLDER_SECTIONS)).not.toContain("merek");
    expect(Object.keys(PLACEHOLDER_SECTIONS)).not.toContain("mobil");
    expect(Object.keys(PLACEHOLDER_SECTIONS)).not.toContain("");
  });
});
