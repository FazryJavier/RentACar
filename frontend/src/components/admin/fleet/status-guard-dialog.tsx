"use client";

import { useState } from "react";
import { FormAlert } from "@/components/auth/form-alert";
import {
  BOOKING_STATUS_BADGE,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  Field,
  Textarea,
  type BookingStatus,
} from "@/components/ui";
import type { BlockingBooking } from "@/lib/admin-api";
import { formatDateTimeWib } from "@/lib/format";

/**
 * Shown when a status change hits bookings that hold the car's schedule. The admin can cancel
 * them with a reason ("Tetap ubah"), except while the car is out on an ongoing rental.
 */
export function StatusGuardDialog({
  open,
  bookings,
  message,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  bookings: BlockingBooking[];
  message: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ongoing = bookings.some((booking) => booking.status === "ongoing");

  function confirm() {
    const trimmed = reason.trim();
    if (trimmed.length < 5 || trimmed.length > 300) {
      setError("Tulis alasan pembatalan (5–300 karakter)");
      return;
    }
    setError(null);
    onConfirm(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onCancel())}>
      <DialogContent
        title={ongoing ? "Mobil sedang disewa" : "Status mobil memengaruhi pemesanan"}
        description={message}
      >
        <ul className="flex flex-col gap-3">
          {bookings.map((booking) => {
            const badge = BOOKING_STATUS_BADGE[booking.status as BookingStatus];
            return (
              <li
                key={booking.code}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <span className="flex flex-col">
                  <span className="text-body-sm text-text font-semibold">{booking.code}</span>
                  <span className="text-caption text-text-muted">
                    Ambil {formatDateTimeWib(booking.pickup_at)}
                  </span>
                </span>
                {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
              </li>
            );
          })}
        </ul>
        {ongoing ? (
          <FormAlert
            alert={{
              tone: "warning",
              message: "Ubah status setelah mobil dikembalikan dan pemesanan selesai.",
            }}
          />
        ) : (
          <div className="mt-4">
            <Field
              label="Alasan pembatalan"
              help="Pemesanan di atas akan dibatalkan dengan alasan ini."
              error={error ?? undefined}
              required
            >
              <Textarea
                size="sm"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {ongoing ? "Tutup" : "Batal"}
          </Button>
          {ongoing ? null : (
            <Button variant="danger" loading={loading} onClick={confirm}>
              Tetap ubah
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
