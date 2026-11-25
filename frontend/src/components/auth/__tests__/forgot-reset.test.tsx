import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FORGOT_CONFIRMATION, ForgotForm } from "@/components/auth/forgot-form";
import { INVALID_LINK_MESSAGE, ResetForm } from "@/components/auth/reset-form";
import { fail, mockApi, ok } from "../../../../tests/unit/api-mock";
import { nav } from "../../../../tests/unit/navigation-mock";
import { renderWithProviders } from "../../../../tests/unit/render-with-providers";

vi.mock("next/navigation", async () =>
  (await import("../../../../tests/unit/navigation-mock")).navigationModule(),
);

beforeEach(() => nav.reset("/lupa-kata-sandi"));
afterEach(() => vi.unstubAllGlobals());

describe("ForgotForm", () => {
  it("shows the same confirmation for any valid email", async () => {
    const calls = mockApi({
      "POST /auth/forgot-password": { status: 200, body: ok(null, FORGOT_CONFIRMATION) },
    });
    renderWithProviders(<ForgotForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Email/), "siapa@example.test");
    await user.click(screen.getByRole("button", { name: "Kirim tautan" }));

    expect(await screen.findByText(FORGOT_CONFIRMATION)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kembali ke halaman masuk" })).toHaveAttribute(
      "href",
      "/masuk",
    );
    expect(calls[0]!.body).toEqual({ email: "siapa@example.test" });
  });
});

describe("ResetForm", () => {
  it("explains a link without token or email", () => {
    nav.reset("/atur-ulang-kata-sandi", "email=budi%40example.test");
    renderWithProviders(<ResetForm />);

    expect(screen.getByRole("alert")).toHaveTextContent(INVALID_LINK_MESSAGE);
    expect(screen.getByRole("link", { name: "Minta tautan baru" })).toHaveAttribute(
      "href",
      "/lupa-kata-sandi",
    );
  });

  async function submitNewPassword() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Kata sandi baru/), "baru12345");
    await user.type(screen.getByLabelText(/Konfirmasi kata sandi baru/), "baru12345");
    await user.click(screen.getByRole("button", { name: "Simpan kata sandi" }));
  }

  it("resets with the token from the link and goes to the login page", async () => {
    nav.reset("/atur-ulang-kata-sandi", "token=abc&email=budi%40example.test");
    const calls = mockApi({ "POST /auth/reset-password": { status: 200, body: ok(null) } });
    renderWithProviders(<ResetForm />);

    await submitNewPassword();

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/masuk"));
    expect(calls[0]!.body).toEqual({
      token: "abc",
      email: "budi@example.test",
      password: "baru12345",
      password_confirmation: "baru12345",
    });
  });

  it("shows an expired token as an alert with a new-link action", async () => {
    nav.reset("/atur-ulang-kata-sandi", "token=old&email=budi%40example.test");
    mockApi({
      "POST /auth/reset-password": {
        status: 422,
        body: fail(422, "Data yang dikirim tidak valid.", [
          { field: "token", code: "invalid", message: INVALID_LINK_MESSAGE },
        ]),
      },
    });
    renderWithProviders(<ResetForm />);

    await submitNewPassword();

    expect(await screen.findByRole("alert")).toHaveTextContent(INVALID_LINK_MESSAGE);
    expect(screen.getByRole("link", { name: "Minta tautan baru" })).toBeInTheDocument();
  });
});
