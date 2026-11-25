// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

describe("proxy", () => {
  it("redirects visitors without a session cookie to the login page with next", () => {
    const response = proxy(new NextRequest("http://localhost:3000/profil?tab=password"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/masuk?next=%2Fprofil%3Ftab%3Dpassword",
    );
  });

  it("lets requests with the session cookie through", () => {
    const request = new NextRequest("http://localhost:3000/profil", {
      headers: { cookie: "rentacar-session=abc" },
    });

    const response = proxy(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("only runs on customer-only paths", () => {
    expect(config.matcher).toEqual(["/pemesanan/:path*", "/profil/:path*", "/checkout/:path*"]);
  });
});
