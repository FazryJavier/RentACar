import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_BADGE,
  BookingStatusBadge,
  Checkbox,
  Chip,
  Field,
  Input,
  RadioGroup,
  Select,
  Textarea,
} from "@/components/ui";

describe("Field", () => {
  it("wires label, error and help text to the input", () => {
    render(
      <Field label="Email" error="Email wajib diisi" help="Kami kirim konfirmasi ke sini.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    const error = screen.getByText("Email wajib diisi");
    const help = screen.getByText("Kami kirim konfirmasi ke sini.");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([error.id, help.id]);
    expect(input).toHaveAccessibleDescription(/Email wajib diisi/);
  });

  it("omits aria-invalid without an error", () => {
    render(
      <Field label="Catatan" help="Opsional.">
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByLabelText("Catatan");

    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).toHaveAttribute("aria-describedby", screen.getByText("Opsional.").id);
  });

  it("has no aria-describedby without help or error", () => {
    render(
      <Field label="Nama" required>
        <Input />
      </Field>,
    );

    expect(screen.getByLabelText(/Nama/)).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText(/Nama/)).toHaveAttribute("aria-required", "true");
  });
});

describe("Field on dark surfaces", () => {
  it("uses on-dark colours for label, help and error", () => {
    render(
      <Field label="Email" tone="on-dark" help="Bantuan" error="Salah">
        <Input />
      </Field>,
    );

    expect(screen.getByText("Email").className).toContain("text-text-on-dark");
    expect(screen.getByText("Bantuan").className).toContain("text-text-on-dark-muted");
    expect(screen.getByText("Salah").className).toContain("text-danger-bg");
  });
});

describe("Select", () => {
  const options = [
    { value: "jakarta", label: "Jakarta" },
    { value: "bandung", label: "Bandung" },
  ];

  it("opens with the keyboard and selects an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Field label="Cabang">
        <Select options={options} onValueChange={onValueChange} />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "Cabang" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("bandung");
    expect(trigger).toHaveTextContent("Bandung");
  });

  it("closes with Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select
        aria-label="Cabang"
        options={options}
        defaultValue="jakarta"
        onValueChange={onValueChange}
      />,
    );

    screen.getByRole("combobox").focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox")).toHaveTextContent("Jakarta");
  });

  it("marks the trigger invalid inside a Field with an error", () => {
    render(
      <Field label="Cabang" error="Cabang wajib dipilih">
        <Select options={options} />
      </Field>,
    );

    expect(screen.getByRole("combobox", { name: "Cabang" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});

describe("RadioGroup and Checkbox", () => {
  it("moves selection with arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Field label="Serah terima">
        <RadioGroup
          defaultValue="branch"
          onValueChange={onValueChange}
          options={[
            { value: "branch", label: "Ambil di cabang" },
            { value: "delivery", label: "Antar ke alamat" },
          ]}
        />
      </Field>,
    );

    expect(screen.getByRole("radiogroup", { name: "Serah terima" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Ambil di cabang" }));
    // Hold the key: Radix selects on the focus that the arrow key causes (focus moves asynchronously).
    await user.keyboard("{ArrowDown>}");
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Antar ke alamat" })).toHaveFocus(),
    );
    await user.keyboard("{/ArrowDown}");

    expect(screen.getByRole("radio", { name: "Antar ke alamat" })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("delivery");
  });

  it("toggles a checkbox with its label and Space", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Saya setuju" onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByText("Saya setuju"));
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);

    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });
});

describe("Badges and chips", () => {
  it.each(BOOKING_STATUSES)("labels booking status %s", (status) => {
    render(<BookingStatusBadge status={status} />);

    expect(screen.getByText(BOOKING_STATUS_BADGE[status].label)).toBeInTheDocument();
  });

  it("maps statuses to the documented tones", () => {
    expect(BOOKING_STATUS_BADGE.pending_payment.tone).toBe("warning");
    expect(BOOKING_STATUS_BADGE.pending_verification.tone).toBe("info");
    expect(BOOKING_STATUS_BADGE.confirmed.tone).toBe("success");
    expect(BOOKING_STATUS_BADGE.ongoing.tone).toBe("accent-solid");
    expect(BOOKING_STATUS_BADGE.completed.tone).toBe("success-outline");
    expect(BOOKING_STATUS_BADGE.cancelled.tone).toBe("neutral");
    expect(BOOKING_STATUS_BADGE.expired.tone).toBe("neutral");
    expect(BOOKING_STATUS_BADGE.rejected.tone).toBe("danger");
  });

  it("rejects unknown statuses at compile time", () => {
    // @ts-expect-error not a booking status
    const element = <BookingStatusBadge status="paid" />;
    expect(element).toBeTruthy();
  });

  it("toggles a chip and exposes aria-pressed", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [pressed, setPressed] = useState(false);
      return (
        <Chip
          pressed={pressed}
          onPressedChange={setPressed}
          onRemove={() => setPressed(false)}
          removeLabel="Hapus filter SUV"
        >
          SUV
        </Chip>
      );
    }

    render(<Harness />);
    const chip = screen.getByRole("button", { name: "SUV" });

    expect(chip).toHaveAttribute("aria-pressed", "false");
    chip.focus();
    await user.keyboard(" ");
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Hapus filter SUV" }));
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });
});
