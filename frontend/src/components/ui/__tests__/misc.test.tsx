import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  EmptyState,
  Pagination,
  paginationItems,
  Skeleton,
  Stepper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TOAST_DURATION_MS,
  ToastProvider,
  useToast,
  type ToastInput,
} from "@/components/ui";

afterEach(() => {
  vi.useRealTimers();
});

function ToastTrigger({ toast }: { toast: ToastInput }) {
  const api = useToast();
  return <button onClick={() => api.show(toast)}>Tampilkan</button>;
}

describe("Toast", () => {
  it("auto-dismisses non-error toasts after 5 seconds", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger toast={{ tone: "success", title: "Pemesanan dibuat" }} />
      </ToastProvider>,
    );

    act(() => screen.getByRole("button", { name: "Tampilkan" }).click());
    expect(screen.getByText("Pemesanan dibuat").closest("[role='status']")).not.toBeNull();

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS + 100));
    expect(screen.queryByText("Pemesanan dibuat")).not.toBeInTheDocument();
  });

  it("keeps error toasts until closed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastTrigger toast={{ tone: "error", title: "Gagal mengunggah" }} />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Tampilkan" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText("Gagal mengunggah").closest("[role='alert']")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Tutup notifikasi" }));
    expect(screen.queryByText("Gagal mengunggah")).not.toBeInTheDocument();
  });

  it("requires the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<ToastTrigger toast={{ tone: "info", title: "x" }} />)).toThrow(
      /ToastProvider/,
    );
  });
});

describe("Stepper", () => {
  it("marks done and current steps", () => {
    render(<Stepper steps={["Detail sewa", "Data penyewa", "Konfirmasi"]} current={2} />);

    expect(screen.getByText("Langkah 2 dari 3 — Data penyewa")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    const current = screen
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("aria-current") === "step");
    expect(current).toHaveTextContent("Data penyewa");
    expect(screen.getByText("(selesai)")).toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it.each([
    [1, 10, [1, 2, 3, 4, 5, "ellipsis-end", 10]],
    [5, 10, [1, "ellipsis-start", 4, 5, 6, "ellipsis-end", 10]],
    [10, 10, [1, "ellipsis-start", 6, 7, 8, 9, 10]],
    [3, 7, [1, 2, 3, 4, 5, 6, 7]],
  ])("page %d of %d shows %j", (page, total, expected) => {
    expect(paginationItems(page, total)).toEqual(expected);
  });

  it("disables previous on the first page and marks the current page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={10} onPageChange={onPageChange} />);

    const previous = screen.getByRole("button", { name: /Sebelumnya/ });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    await user.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();

    expect(screen.getByRole("button", { name: "Halaman 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("navigation", { name: "Navigasi halaman" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Halaman 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: /Berikutnya/ }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it("disables next on the last page", () => {
    render(<Pagination page={10} totalPages={10} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Berikutnya/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("Tabs and Accordion", () => {
  it("moves between tabs with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="spec">
        <TabsList aria-label="Detail mobil">
          <TabsTrigger value="spec">Spesifikasi</TabsTrigger>
          <TabsTrigger value="condition">Kondisi</TabsTrigger>
        </TabsList>
        <TabsContent value="spec">Isi spesifikasi</TabsContent>
        <TabsContent value="condition">Isi kondisi</TabsContent>
      </Tabs>,
    );

    await user.click(screen.getByRole("tab", { name: "Spesifikasi" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Kondisi" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Isi kondisi");
  });

  it("toggles an accordion item with Enter", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="q1">
          <AccordionTrigger>Apakah transaksinya sungguhan?</AccordionTrigger>
          <AccordionContent>Tidak, simulasi.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Apakah transaksinya sungguhan?" });

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Tidak, simulasi.")).toBeVisible();

    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Skeleton and EmptyState", () => {
  it("hides skeletons from assistive technology and only shimmers with motion allowed", () => {
    const { container } = render(<Skeleton className="h-4" />);
    const skeleton = container.firstElementChild as HTMLElement;

    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton.className).toContain("motion-safe:animate-shimmer");
    expect(skeleton.className).not.toMatch(/(^|\s)animate-shimmer/);
  });

  it("renders a title, text and a single action", () => {
    render(
      <EmptyState
        title="Belum ada pemesanan"
        description="Mulai dari armada."
        action={<Button>Lihat armada</Button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Belum ada pemesanan" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
