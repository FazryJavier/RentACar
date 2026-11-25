import { describe, expect, it } from "vitest";
import { isProtectedPath, loginUrl, safeNextPath } from "./auth";

describe("safeNextPath", () => {
  it.each([
    ["/pemesanan/RC-1", "/pemesanan/RC-1"],
    ["/profil?tab=password", "/profil?tab=password"],
    ["/armada#hasil", "/armada#hasil"],
  ])("keeps the relative path %s", (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "profil",
    "/\tevil",
  ])("falls back to / for %s", (next) => {
    expect(safeNextPath(next)).toBe("/");
  });
});

describe("protected paths", () => {
  it.each([
    ["/profil", true],
    ["/profil/data", true],
    ["/pemesanan", true],
    ["/checkout", true],
    ["/profilx", false],
    ["/armada", false],
  ])("%s → %s", (path, expected) => {
    expect(isProtectedPath(path)).toBe(expected);
  });

  it("builds the login URL with an encoded next", () => {
    expect(loginUrl("/profil?tab=password")).toBe("/masuk?next=%2Fprofil%3Ftab%3Dpassword");
    expect(loginUrl("//evil")).toBe("/masuk");
  });
});
