import { describe, expect, it } from "vitest";
import { isActivePath } from "./navigation";

describe("isActivePath", () => {
  it.each([
    ["/", "/", true],
    ["/faq", "/", false],
    ["/armada", "/armada", true],
    ["/armada/toyota-avanza", "/armada", true],
    ["/armada/", "/armada", true],
    ["/armadax", "/armada", false],
    ["/cabang", "/armada", false],
  ])("path %s with link %s → %s", (pathname, href, expected) => {
    expect(isActivePath(pathname, href)).toBe(expected);
  });
});
