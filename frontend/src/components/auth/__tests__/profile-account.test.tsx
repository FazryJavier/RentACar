import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/components/auth/profile-page";
import { RequireCustomer } from "@/components/auth/require-customer";
import { Header } from "@/components/layout/header";
import { CURRENT_CUSTOMER_KEY } from "@/hooks/useCurrentCustomer";
import { customerFixture, fail, mockApi, ok } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

beforeEach(() => nav.reset("/profil"));
afterEach(() => vi.unstubAllGlobals());

describe("RequireCustomer", () => {
  it("redirects a stale session to the login page with next", async () => {
    nav.reset("/profil", "tab=password");
    mockApi({ "GET /me": { status: 401, body: fail(401, "Silakan masuk terlebih dahulu.") } });
    renderWithProviders(
      <RequireCustomer>
        <p>Rahasia</p>
      </RequireCustomer>,
    );

    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith("/masuk?next=%2Fprofil%3Ftab%3Dpassword"),
    );
    expect(screen.queryByText("Rahasia")).not.toBeInTheDocument();
  });

  it("renders children for a signed-in customer", async () => {
    mockApi({ "GET /me": { status: 200, body: ok(customerFixture) } });
    renderWithProviders(
      <RequireCustomer>
        <p>Isi profil</p>
      </RequireCustomer>,
    );

    expect(await screen.findByText("Isi profil")).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
  });
});

describe("Profile page", () => {
  it("saves profile changes, shows a toast and updates the cache", async () => {
    const updated = { ...customerFixture, phone: "6281200001111" };
    const calls = mockApi({
      "GET /me": { status: 200, body: ok(customerFixture) },
      "PATCH /me": { status: 200, body: ok(updated) },
    });
    const { queryClient } = renderWithProviders(<ProfilePage />);
    const user = userEvent.setup();

    const phone = await screen.findByLabelText(/No\. HP/);
    await user.clear(phone);
    await user.type(phone, "+62 812 0000 1111");
    await user.click(screen.getByRole("button", { name: "Simpan profil" }));

    expect(await screen.findByText("Profil disimpan")).toBeInTheDocument();
    expect(calls.find((c) => c.key === "PATCH /me")!.body).toMatchObject({
      phone: "+6281200001111",
    });
    expect(queryClient.getQueryData(CURRENT_CUSTOMER_KEY)).toEqual(updated);
  });

  it("shows a wrong current password on its field", async () => {
    mockApi({
      "GET /me": { status: 200, body: ok(customerFixture) },
      "PUT /me/password": {
        status: 422,
        body: fail(422, "Data yang dikirim tidak valid.", [
          { field: "current_password", code: "mismatch", message: "Kata sandi lama salah" },
        ]),
      },
    });
    renderWithProviders(<ProfilePage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("tab", { name: "Ubah kata sandi" }));
    await user.type(screen.getByLabelText(/Kata sandi lama/), "salah12345");
    await user.type(screen.getByLabelText(/^Kata sandi baru/), "baru12345");
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi baru/), "baru12345");
    await user.click(screen.getByRole("button", { name: "Ubah kata sandi" }));

    expect(await screen.findByText("Kata sandi lama salah")).toBeInTheDocument();
    expect(screen.getByLabelText(/Kata sandi lama/)).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Account menu", () => {
  it("lists the account actions and logs out", async () => {
    nav.reset("/");
    const calls = mockApi({
      "GET /me": { status: 200, body: ok(customerFixture) },
      "POST /auth/logout": { status: 200, body: ok(null) },
    });
    const { queryClient } = renderWithProviders(<Header />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Akun Budi" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Pemesanan Saya" })).toHaveAttribute(
      "href",
      "/pemesanan",
    );
    expect(within(menu).getByRole("menuitem", { name: "Profil" })).toHaveAttribute(
      "href",
      "/profil",
    );

    await user.click(within(menu).getByRole("menuitem", { name: "Keluar" }));

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/"));
    expect(calls.some((c) => c.key === "POST /auth/logout")).toBe(true);
    expect(queryClient.getQueryData(CURRENT_CUSTOMER_KEY)).toBeNull();
    expect(await screen.findByText("Anda sudah keluar")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Masuk" })).toBeInTheDocument();
  });
});
