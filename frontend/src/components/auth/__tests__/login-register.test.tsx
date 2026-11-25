import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { CURRENT_CUSTOMER_KEY } from "@/hooks/useCurrentCustomer";
import { customerFixture, fail, mockApi, ok } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

beforeEach(() => {
  nav.reset("/masuk", "next=/pemesanan/RC-1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function fillLogin(email = "budi@example.test", password = "rahasia123") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Email/), email);
  await user.type(screen.getByLabelText(/Kata sandi/), password);
  await user.click(screen.getByRole("button", { name: "Masuk" }));
  return user;
}

describe("LoginForm", () => {
  it("signs in, caches the customer and goes to next", async () => {
    const calls = mockApi({ "POST /auth/login": { status: 200, body: ok(customerFixture) } });
    const { queryClient } = renderWithProviders(<LoginForm />);

    await fillLogin();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/pemesanan/RC-1"));
    expect(calls[0]).toEqual({
      key: "POST /auth/login",
      body: { email: "budi@example.test", password: "rahasia123", remember: false },
    });
    expect(queryClient.getQueryData(CURRENT_CUSTOMER_KEY)).toEqual(customerFixture);
  });

  it("ignores an unsafe next", async () => {
    nav.reset("/masuk", "next=//evil.example");
    mockApi({ "POST /auth/login": { status: 200, body: ok(customerFixture) } });
    renderWithProviders(<LoginForm />);

    await fillLogin();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/"));
  });

  it("shows the generic error, clears and focuses the password on 401", async () => {
    mockApi({
      "POST /auth/login": { status: 401, body: fail(401, "Email atau kata sandi salah.") },
    });
    renderWithProviders(<LoginForm />);

    await fillLogin("budi@example.test", "salah12345");

    expect(await screen.findByRole("alert")).toHaveTextContent("Email atau kata sandi salah.");
    const password = screen.getByLabelText(/Kata sandi/);
    expect(password).toHaveValue("");
    expect(password).toHaveFocus();
  });

  it("disables submitting during the Retry-After countdown on 429", async () => {
    mockApi({
      "POST /auth/login": {
        status: 429,
        body: fail(429, "Terlalu banyak permintaan."),
        headers: { "Retry-After": "2" },
      },
    });
    renderWithProviders(<LoginForm />);

    await fillLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent("Coba lagi dalam 2 detik");
    const button = screen.getByRole("button", { name: /Coba lagi dalam/ });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await waitFor(
      () =>
        expect(screen.getByRole("button", { name: "Masuk" })).not.toHaveAttribute("aria-disabled"),
      {
        timeout: 4000,
      },
    );
  });

  it("shows the blocked-account message", async () => {
    mockApi({
      "POST /auth/login": {
        status: 403,
        body: fail(403, "Akun dinonaktifkan. Hubungi admin.", [
          { field: null, code: "account_blocked", message: "x" },
        ]),
      },
    });
    renderWithProviders(<LoginForm />);

    await fillLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Akun dinonaktifkan. Hubungi admin.",
    );
  });

  it("validates on the client before calling the API", async () => {
    const calls = mockApi({});
    renderWithProviders(<LoginForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByText("Email tidak valid")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute("aria-invalid", "true");
    expect(calls).toHaveLength(0);
  });
});

describe("RegisterForm", () => {
  async function fillRegister() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Nama lengkap/), "Budi Santoso");
    await user.type(screen.getByLabelText(/^Email/), "budi@example.test");
    await user.type(screen.getByLabelText(/No\. HP/), "0812-3456-7890");
    await user.type(screen.getByLabelText(/^Kata sandi/), "rahasia123");
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi/), "rahasia123");
    await user.click(screen.getByRole("button", { name: "Daftar" }));
  }

  it("shows a server not_unique error on the email field", async () => {
    mockApi({
      "POST /auth/register": {
        status: 422,
        body: fail(422, "Data yang dikirim tidak valid.", [
          { field: "email", code: "not_unique", message: "Email sudah terdaftar" },
        ]),
      },
    });
    renderWithProviders(<RegisterForm />);

    await fillRegister();

    expect(await screen.findByText("Email sudah terdaftar")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute("aria-invalid", "true");
  });

  it("registers, sends a cleaned phone and redirects", async () => {
    const calls = mockApi({ "POST /auth/register": { status: 201, body: ok(customerFixture) } });
    renderWithProviders(<RegisterForm />);

    await act(fillRegister);

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/pemesanan/RC-1"));
    expect((calls[0]!.body as { phone: string }).phone).toBe("081234567890");
  });
});
