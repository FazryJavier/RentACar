import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field, FileDropzone } from "@/components/ui";

const MB = 1024 * 1024;

function file(name: string, type: string, size: number) {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

function renderDropzone(onFileChange = vi.fn()) {
  render(
    <Field label="Bukti transfer">
      <FileDropzone
        accept={["image/jpeg", "image/png"]}
        maxSize={5 * MB}
        typeLabel="JPG atau PNG"
        onFileChange={onFileChange}
      />
    </Field>,
  );
  return onFileChange;
}

function drop(target: HTMLElement, f: File) {
  fireEvent.drop(target, { dataTransfer: { files: [f] } });
}

describe("FileDropzone", () => {
  it("accepts a valid dropped file and shows its name and size", () => {
    const onFileChange = renderDropzone();
    const accepted = file("bukti.jpg", "image/jpeg", MB);

    drop(screen.getByRole("button", { name: /Bukti transfer/ }), accepted);

    expect(onFileChange).toHaveBeenCalledWith(accepted);
    expect(screen.getByText("bukti.jpg")).toBeInTheDocument();
    expect(screen.getByText("1,0 MB")).toBeInTheDocument();
  });

  it("accepts exactly maxSize and rejects one byte more", () => {
    const onFileChange = renderDropzone();
    const zone = screen.getByRole("button", { name: /Bukti transfer/ });

    drop(zone, file("besar.png", "image/png", 5 * MB + 1));
    expect(screen.getByRole("alert")).toHaveTextContent("Ukuran file maksimal 5,0 MB");
    expect(zone).toHaveAccessibleDescription(/Ukuran file maksimal 5,0 MB/);
    expect(onFileChange).not.toHaveBeenCalled();

    drop(zone, file("pas.png", "image/png", 5 * MB));
    expect(onFileChange).toHaveBeenCalledOnce();
  });

  it("rejects a disallowed type", () => {
    const onFileChange = renderDropzone();

    drop(
      screen.getByRole("button", { name: /Bukti transfer/ }),
      file("bukti.pdf", "application/pdf", MB),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Tipe file harus JPG atau PNG");
    expect(onFileChange).not.toHaveBeenCalled();
  });

  it("selects through the file input and removes the file", async () => {
    const user = userEvent.setup();
    const onFileChange = renderDropzone();
    const chosen = file("bukti.png", "image/png", 2048);

    await user.upload(screen.getByTestId("file-dropzone-input"), chosen);
    expect(onFileChange).toHaveBeenLastCalledWith(chosen);

    await user.click(screen.getByRole("button", { name: "Hapus bukti.png" }));
    expect(onFileChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole("button", { name: /Bukti transfer/ })).toBeInTheDocument();
  });

  it("opens the chooser with Enter and Space", async () => {
    const user = userEvent.setup();
    renderDropzone();
    const input = screen.getByTestId("file-dropzone-input");
    const click = vi.spyOn(input, "click");

    screen.getByRole("button", { name: /Bukti transfer/ }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(click).toHaveBeenCalledTimes(2);
  });

  it("highlights while a file is dragged over it", () => {
    renderDropzone();
    const zone = screen.getByRole("button", { name: /Bukti transfer/ });

    fireEvent.dragEnter(zone);
    expect(zone.className).toContain("bg-accent-wash");
    fireEvent.dragLeave(zone);
    expect(zone.className).not.toContain("bg-accent-wash");
  });
});
