import { describe, expect, it } from "vitest";
import { markLogout, takeLogoutDestination } from "./logout-intent";

describe("logout intent", () => {
  it("is consumed once", () => {
    expect(takeLogoutDestination()).toBeNull();
    markLogout("/admin/masuk");
    expect(takeLogoutDestination()).toBe("/admin/masuk");
    expect(takeLogoutDestination()).toBeNull();
  });
});
