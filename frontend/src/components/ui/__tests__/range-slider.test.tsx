import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { RangeSlider } from "@/components/ui";

function Harness({ onValueChange }: { onValueChange: (value: [number, number]) => void }) {
  const [value, setValue] = useState<[number, number]>([200000, 800000]);
  return (
    <RangeSlider
      min={100000}
      max={3000000}
      step={50000}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
      thumbLabels={["Harga minimum", "Harga maksimum"]}
      formatValue={(number) => `Rp${number}`}
    />
  );
}

describe("RangeSlider", () => {
  it("names both thumbs and speaks their values", () => {
    render(<Harness onValueChange={vi.fn()} />);

    expect(screen.getByRole("slider", { name: "Harga minimum" })).toHaveAttribute(
      "aria-valuetext",
      "Rp200000",
    );
    expect(screen.getByRole("slider", { name: "Harga maksimum" })).toHaveAttribute(
      "aria-valuenow",
      "800000",
    );
  });

  it("moves a thumb by one step with the arrow keys and ten with Page Up", async () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    const user = userEvent.setup();

    screen.getByRole("slider", { name: "Harga minimum" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([250000, 800000]);

    await user.keyboard("{PageUp}");
    expect(onValueChange).toHaveBeenLastCalledWith([750000, 800000]);
  });
});
