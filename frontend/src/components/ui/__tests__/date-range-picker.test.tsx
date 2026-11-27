import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "@/components/ui";

const originalTz = process.env.TZ;

function renderPicker(
  onChange = vi.fn(),
  props: Partial<Parameters<typeof DateRangePicker>[0]> = {},
) {
  render(
    <DateRangePicker
      openTime="08:00"
      closeTime="20:00"
      minDate="2026-11-24"
      maxDate="2026-12-31"
      disabledDates={["2026-11-25"]}
      onChange={onChange}
      {...props}
    />,
  );
  return onChange;
}

function day(name: RegExp) {
  return within(screen.getByRole("grid")).getByRole("button", { name });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-24T02:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  process.env.TZ = originalTz;
});

describe("DateRangePicker", () => {
  it("offers 30-minute slots inside opening hours", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: /Pilih tanggal/ }));
    await user.click(await screen.findByRole("combobox", { name: "Jam ambil" }));
    const options = await screen.findAllByRole("option");

    expect(options).toHaveLength(25);
    expect(options[0]).toHaveTextContent("08:00");
    expect(options.at(-1)).toHaveTextContent("20:00");
  });

  it.each(["Asia/Jakarta", "America/New_York"])(
    "emits WIB ISO values for a range (host zone %s)",
    async (zone) => {
      process.env.TZ = zone;
      const user = userEvent.setup();
      const onChange = renderPicker(vi.fn(), { disabledDates: [] });

      await user.click(screen.getByRole("button", { name: /Pilih tanggal/ }));
      await user.click(day(/24 November 2026/));
      await user.click(day(/26 November 2026/));

      expect(onChange).toHaveBeenLastCalledWith({
        pickupAt: "2026-11-24T08:00:00+07:00",
        returnAt: "2026-11-26T08:00:00+07:00",
      });

      await user.click(screen.getByRole("combobox", { name: "Jam ambil" }));
      await user.click(await screen.findByRole("option", { name: "09:00" }));
      await user.click(screen.getByRole("combobox", { name: "Jam kembali" }));
      await user.click(await screen.findByRole("option", { name: "09:00" }));

      expect(onChange).toHaveBeenLastCalledWith({
        pickupAt: "2026-11-24T09:00:00+07:00",
        returnAt: "2026-11-26T09:00:00+07:00",
      });
    },
    // Two hour listboxes with ~30 options each: slow on Windows when the whole suite runs in parallel.
    30_000,
  );

  it("disables dates before minDate and listed dates", async () => {
    const user = userEvent.setup();
    const onChange = renderPicker();

    await user.click(screen.getByRole("button", { name: /Pilih tanggal/ }));

    expect(day(/23 November 2026/)).toBeDisabled();
    expect(day(/25 November 2026/)).toBeDisabled();
    expect(day(/24 November 2026/)).toBeEnabled();

    await user.click(day(/23 November 2026/));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("restarts the range when it would span a disabled date", async () => {
    const user = userEvent.setup();
    const onChange = renderPicker();

    await user.click(screen.getByRole("button", { name: /Pilih tanggal/ }));
    await user.click(day(/24 November 2026/));
    await user.click(day(/26 November 2026/));

    expect(onChange).toHaveBeenLastCalledWith({
      pickupAt: "2026-11-26T08:00:00+07:00",
      returnAt: null,
    });
  });

  it("is operable with the keyboard and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onChange = renderPicker(vi.fn(), { disabledDates: [] });
    const trigger = screen.getByRole("button", { name: /Pilih tanggal/ });

    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(day(/24 November 2026/)).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    expect(day(/25 November 2026/)).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith({
      pickupAt: "2026-11-25T08:00:00+07:00",
      returnAt: null,
    });

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("grid")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("DateRangePicker initial value and disabled state", () => {
  it("shows a restored range without reporting a change", () => {
    const onChange = renderPicker(vi.fn(), {
      defaultValue: {
        pickupAt: "2026-12-03T09:00:00+07:00",
        returnAt: "2026-12-05T17:30:00+07:00",
      },
    });

    expect(
      screen.getByRole("button", { name: /3 Des 2026 09:00 – .*5 Des 2026 17:30/ }),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not open when disabled", async () => {
    vi.useRealTimers();
    renderPicker(vi.fn(), { disabled: true, placeholder: "Pilih cabang dulu" });
    const trigger = screen.getByRole("button", { name: "Pilih cabang dulu" });

    await userEvent.setup().click(trigger);

    expect(trigger).toBeDisabled();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
