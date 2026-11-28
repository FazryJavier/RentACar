import Link from "next/link";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, IconButton } from "@/components/ui";

describe("Button", () => {
  it.each(["primary", "accent", "secondary", "ghost", "light", "danger"] as const)(
    "renders the %s variant",
    (variant) => {
      render(<Button variant={variant}>Sewa</Button>);

      expect(screen.getByRole("button", { name: "Sewa" })).toHaveAttribute("type", "button");
    },
  );

  it("uses navy for primary with navy-800 on hover", () => {
    render(<Button>Sewa Sekarang</Button>);

    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-navy-900");
    expect(button.className).toContain("hover:bg-navy-800");
  });

  it.each([
    ["sm", "h-9"],
    ["md", "h-12"],
    ["lg", "h-14"],
  ] as const)("size %s is %s", (size, height) => {
    render(<Button size={size}>Cari</Button>);

    expect(screen.getByRole("button").className).toContain(height);
  });

  it("calls onClick once for click, Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Cari</Button>);

    await user.click(screen.getByRole("button"));
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("blocks activation while loading and keeps the label", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Buat Pemesanan
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Buat Pemesanan" });

    await user.click(button);
    button.focus();
    await user.keyboard("{Enter}");

    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button.querySelector("svg[data-motion='essential']")).not.toBeNull();
  });

  it("stays focusable but inert when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Hapus
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Hapus" });

    await user.tab();
    expect(button).toHaveFocus();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("renders a link with button styles via asChild", () => {
    render(
      <Button asChild variant="secondary">
        <Link href="/armada">Lihat armada</Link>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Lihat armada" });

    expect(link).toHaveAttribute("href", "/armada");
    expect(link.className).toContain("rounded-full");
    expect(link).not.toHaveAttribute("type");
  });
});

describe("IconButton", () => {
  it("is a 40px round button named by aria-label", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Berikutnya" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "Berikutnya" });

    await user.click(button);

    expect(button.className).toContain("size-10");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("requires an accessible label at compile time", () => {
    // @ts-expect-error aria-label is required
    const element = <IconButton>x</IconButton>;
    expect(element).toBeTruthy();
  });
});
