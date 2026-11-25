import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminProfile } from "@/components/admin/admin-profile";
import { LoginForm } from "@/components/auth/login-form";
import { CURRENT_ADMIN_KEY } from "@/hooks/useCurrentAdmin";
import { fail, mockApi, ok, staffFixture } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

afterEach(() => vi.unstubAllGlobals());

async function login() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Email/), "sari@example.test");
  await user.type(screen.getByLabelText(/Kata sandi/), "rahasia123");
  await user.click(screen.getByRole("button", { name: "Masuk" }));
}

describe("admin LoginForm", () => {
  beforeEach(() => nav.reset("/admin/masuk", "next=/admin/profil"));

  it("posts to the admin endpoint, caches the admin and stays inside /admin", async () => {
    const calls = mockApi({ "POST /admin/auth/login": { status: 200, body: ok(staffFixture) } });
    const { queryClient } = renderWithProviders(<LoginForm audience="admin" />);

    await login();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/admin/profil"));
    expect(calls[0]!.key).toBe("POST /admin/auth/login");
    expect(queryClient.getQueryData(CURRENT_ADMIN_KEY)).toEqual(staffFixture);
  });

  it("ignores a next outside the admin panel", async () => {
    nav.reset("/admin/masuk", "next=/profil");
    mockApi({ "POST /admin/auth/login": { status: 200, body: ok(staffFixture) } });
    renderWithProviders(<LoginForm audience="admin" />);

    await login();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/admin"));
  });

  it("shows the inactive-account message", async () => {
    mockApi({
      "POST /admin/auth/login": {
        status: 403,
        body: fail(403, "Akun dinonaktifkan. Hubungi admin.", [
          { field: null, code: "account_blocked", message: "x" },
        ]),
      },
    });
    renderWithProviders(<LoginForm audience="admin" />);

    await login();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Akun dinonaktifkan. Hubungi admin.",
    );
  });
});

describe("AdminProfile", () => {
  it("shows the account data and a wrong current password on its field", async () => {
    nav.reset("/admin/profil");
    const calls = mockApi({
      "GET /admin/me": { status: 200, body: ok(staffFixture) },
      "PUT /admin/me/password": {
        status: 422,
        body: fail(422, "Data yang dikirim tidak valid.", [
          { field: "current_password", code: "mismatch", message: "Kata sandi lama salah" },
        ]),
      },
    });
    renderWithProviders(<AdminProfile />);
    const user = userEvent.setup();

    expect(await screen.findByText("Jakarta Selatan")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Kata sandi lama/), "salah12345");
    await user.type(screen.getByLabelText(/^Kata sandi baru/), "baru12345");
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi baru/), "baru12345");
    await user.click(screen.getByRole("button", { name: "Ubah kata sandi" }));

    expect(await screen.findByText("Kata sandi lama salah")).toBeInTheDocument();
    expect(calls.some((c) => c.key === "PUT /admin/me/password")).toBe(true);
  });
});
