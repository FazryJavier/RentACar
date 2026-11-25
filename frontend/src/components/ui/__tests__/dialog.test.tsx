import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  BottomSheetContent,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui";

function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">Hapus mobil</Button>
      </DialogTrigger>
      <DialogContent title="Hapus mobil ini?" description="Tindakan ini tidak bisa dibatalkan.">
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Batal</Button>
          </DialogClose>
          <Button variant="danger">Hapus</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens as a named modal and moves focus inside", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus mobil" }));
    const dialog = await screen.findByRole("dialog", { name: "Hapus mobil ini?" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Tindakan ini tidak bisa dibatalkan.");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(dialog.className).toContain("max-w-confirm");
  });

  it("traps focus with Tab", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus mobil" }));
    const dialog = await screen.findByRole("dialog");

    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    const trigger = screen.getByRole("button", { name: "Hapus mobil" });

    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from the labelled close button", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus mobil" }));
    await user.click(await screen.findByRole("button", { name: "Tutup" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("uses fade-only animation classes under reduced motion", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus mobil" }));
    const dialog = await screen.findByRole("dialog");

    expect(dialog.className).toContain("motion-safe:data-[state=open]:animate-zoom-in");
    expect(dialog.className).toContain("motion-reduce:data-[state=open]:animate-fade-in");
  });
});

describe("BottomSheet", () => {
  it("renders a named modal sheet with a handle", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Detail</Button>
        </DialogTrigger>
        <BottomSheetContent title="Penanda kondisi #2">
          <p>Baret ringan.</p>
        </BottomSheetContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Detail" }));
    const sheet = await screen.findByRole("dialog", { name: "Penanda kondisi #2" });

    expect(sheet.className).toContain("max-h-sheet");
    expect(sheet.className).toContain("motion-reduce:data-[state=open]:animate-fade-in");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
