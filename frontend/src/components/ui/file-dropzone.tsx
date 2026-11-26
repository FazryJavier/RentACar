"use client";

import { FileText, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { formatFileSize } from "@/lib/format";
import { useFieldControl, useFieldLabelId } from "./field";
import { IconButton } from "./icon-button";

export type FileDropzoneProps = {
  /** Allowed MIME types, e.g. ["image/jpeg", "image/png"]. */
  accept: readonly string[];
  /** Maximum size in bytes (inclusive). */
  maxSize: number;
  /** Human label of the allowed types, e.g. "JPG atau PNG". */
  typeLabel: string;
  /** Single-file mode: the chosen file, or null when removed. */
  onFileChange?: (file: File | null) => void;
  /** Accept several files at once; valid files are passed to `onFilesChange` and the area resets. */
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Upload area for one file (with preview) or, with `multiple`, several files at once.
 * Type and size checks here are for user experience only; the server always validates
 * the content and size again.
 */
export function FileDropzone({
  accept,
  maxSize,
  typeLabel,
  onFileChange,
  multiple = false,
  onFilesChange,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const field = useFieldControl();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldLabelId = useFieldLabelId();
  const baseId = useId();
  const errorId = `${baseId}-error`;
  const promptId = `${baseId}-prompt`;
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function problemOf(candidate: File): string | null {
    if (!accept.includes(candidate.type)) {
      return `Tipe file harus ${typeLabel}`;
    }
    if (candidate.size > maxSize) {
      return `Ukuran file maksimal ${formatFileSize(maxSize)}`;
    }
    return null;
  }

  function chooseMany(candidates: FileList | null | undefined) {
    const list = Array.from(candidates ?? []);
    if (list.length === 0) {
      return;
    }
    const rejected = list.find((candidate) => problemOf(candidate) !== null);
    setError(rejected ? `${rejected.name}: ${problemOf(rejected)}` : null);
    const valid = list.filter((candidate) => problemOf(candidate) === null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (valid.length > 0) {
      onFilesChange?.(valid);
    }
  }

  function choose(candidate: File | undefined) {
    if (!candidate) {
      return;
    }
    const problem = problemOf(candidate);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(candidate);
    setPreview(
      candidate.type.startsWith("image/") && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(candidate)
        : null,
    );
    onFileChange?.(candidate);
  }

  function remove() {
    setFile(null);
    setError(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange?.(null);
  }

  function openChooser() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openChooser();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) {
      if (multiple) {
        chooseMany(event.dataTransfer.files);
      } else {
        choose(event.dataTransfer.files[0]);
      }
    }
  }

  const describedBy =
    [error ? errorId : null, field["aria-describedby"]].filter(Boolean).join(" ") || undefined;

  if (file) {
    return (
      <div
        className={cn(
          "border-border bg-surface flex items-center gap-3 rounded-lg border p-3",
          className,
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img
            src={preview}
            alt=""
            className="bg-surface-muted size-16 shrink-0 rounded-sm object-cover"
          />
        ) : (
          <span className="bg-accent-wash text-accent inline-flex size-16 shrink-0 items-center justify-center rounded-sm">
            <FileText aria-hidden="true" strokeWidth={1.75} className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-text truncate font-semibold">{file.name}</p>
          <p className="text-caption text-text-subtle">{formatFileSize(file.size)}</p>
        </div>
        <IconButton variant="ghost" aria-label={`Hapus ${file.name}`} onClick={remove}>
          <X aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        id={field.id}
        aria-labelledby={[fieldLabelId, promptId].filter(Boolean).join(" ")}
        aria-disabled={disabled || undefined}
        aria-describedby={describedBy}
        onClick={openChooser}
        onKeyDown={handleKeyDown}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center",
          "ease-standard focus-visible:focus-ring transition-colors duration-(--motion-fast)",
          dragging ? "border-accent bg-accent-wash" : "border-border-strong bg-surface",
          error ? "border-danger" : null,
          disabled ? "cursor-not-allowed opacity-40" : null,
        )}
      >
        <Upload aria-hidden="true" strokeWidth={1.75} className="text-accent size-8" />
        <p id={promptId} className="text-body-sm text-text font-semibold">
          Seret file ke sini atau pilih file
        </p>
        <p className="text-caption text-text-subtle">
          {typeLabel}, maksimal {formatFileSize(maxSize)}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        accept={accept.join(",")}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) =>
          multiple ? chooseMany(event.target.files) : choose(event.target.files?.[0])
        }
        data-testid="file-dropzone-input"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
