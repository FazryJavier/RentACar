"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { id as idLocale } from "react-day-picker/locale";
import { cn } from "@/lib/cn";
import { formatDateWib } from "@/lib/format";
import {
  buildTimeSlots,
  dateKeyToNoon,
  fromIso,
  toDateKey,
  toWibIso,
  WIB_TIME_ZONE,
  type DateKey,
} from "@/lib/wib";
import { Button } from "./button";
import { useFieldControl } from "./field";
import { controlVariants } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Select } from "./select";

export type DateRangeValue = { pickupAt: string | null; returnAt: string | null };

export type DateRangePickerProps = {
  /** Called with WIB ISO strings (`…+07:00`); a side is `null` until its date is chosen. */
  onChange: (value: DateRangeValue) => void;
  /** Opening hours of the branch, `HH:mm`. Time slots are every 30 minutes, inclusive. */
  openTime: string;
  closeTime: string;
  minDate?: DateKey;
  maxDate?: DateKey;
  disabledDates?: readonly DateKey[];
  defaultPickupTime?: string;
  defaultReturnTime?: string;
  placeholder?: string;
  /** Range shown initially (e.g. restored from the URL); `onChange` is not called on mount. */
  defaultValue?: DateRangeValue;
  /** Non-interactive trigger (e.g. until a branch is chosen). */
  disabled?: boolean;
  size?: "md" | "sm";
  className?: string;
};

type State = { from?: DateKey; to?: DateKey; pickupTime: string; returnTime: string };

/**
 * Pickup–return date range with 30-minute time slots. Works in WIB
 * regardless of the device time zone. It only constrains input; lead time, duration and
 * availability are validated by the form schema and the API.
 */
export function DateRangePicker({
  onChange,
  openTime,
  closeTime,
  minDate,
  maxDate,
  disabledDates = [],
  defaultPickupTime,
  defaultReturnTime,
  placeholder = "Pilih tanggal ambil & kembali",
  defaultValue,
  disabled = false,
  size = "md",
  className,
}: DateRangePickerProps) {
  const field = useFieldControl();
  const slots = useMemo(() => buildTimeSlots(openTime, closeTime), [openTime, closeTime]);
  const options = useMemo(() => slots.map((slot) => ({ value: slot, label: slot })), [slots]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(() => {
    const pickup = fromIso(defaultValue?.pickupAt);
    const back = fromIso(defaultValue?.returnAt);
    const slot = (time: string | undefined, fallback: string | undefined) =>
      time !== undefined && slots.includes(time) ? time : (fallback ?? slots[0] ?? openTime);
    return {
      from: pickup?.key,
      to: back && back.key !== pickup?.key ? back.key : undefined,
      pickupTime: slot(pickup?.time, defaultPickupTime),
      returnTime: slot(back?.time, defaultReturnTime),
    };
  });

  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates]);
  const isDisabled = (date: Date) => {
    const key = toDateKey(date);
    return (
      (minDate !== undefined && key < minDate) ||
      (maxDate !== undefined && key > maxDate) ||
      disabledSet.has(key)
    );
  };

  function update(next: State) {
    setState(next);
    onChange({
      pickupAt: next.from ? toWibIso(next.from, next.pickupTime) : null,
      returnAt: next.to ? toWibIso(next.to, next.returnTime) : null,
    });
  }

  function handleSelect(range: DateRange | undefined) {
    const from = range?.from ? toDateKey(range.from) : undefined;
    const to = range?.to ? toDateKey(range.to) : undefined;
    update({ ...state, from, to: to !== undefined && to !== from ? to : undefined });
  }

  const selected: DateRange | undefined = state.from
    ? { from: dateKeyToNoon(state.from), to: state.to ? dateKeyToNoon(state.to) : undefined }
    : undefined;

  const label = state.from
    ? `${formatDateWib(dateKeyToNoon(state.from))} ${state.pickupTime} – ${
        state.to ? `${formatDateWib(dateKeyToNoon(state.to))} ${state.returnTime}` : "…"
      }`
    : placeholder;

  return (
    <Popover open={open && !disabled} onOpenChange={(next) => setOpen(next && !disabled)}>
      <PopoverTrigger
        ref={triggerRef}
        {...field}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        className={cn(
          controlVariants({ size }),
          "flex items-center gap-2 text-left",
          state.from ? null : "text-text-subtle",
          disabled ? "bg-surface-muted text-text-muted cursor-not-allowed" : null,
          className,
        )}
      >
        <Calendar
          aria-hidden="true"
          strokeWidth={1.75}
          className="text-text-muted size-5 shrink-0"
        />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Pilih tanggal dan jam"
        className="w-auto"
        onOpenAutoFocus={(event) => {
          // Start keyboard users on the calendar's active day (roving tabindex) instead of the
          // first focusable element (the previous-month button).
          const day = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLButtonElement>(
            '[role="gridcell"] button[tabindex="0"]',
          );
          if (day) {
            event.preventDefault();
            day.focus();
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DayPicker
          mode="range"
          timeZone={WIB_TIME_ZONE}
          locale={idLocale}
          selected={selected}
          onSelect={handleSelect}
          disabled={isDisabled}
          excludeDisabled
          defaultMonth={dateKeyToNoon(state.from ?? minDate ?? toDateKey(new Date()))}
          startMonth={minDate ? dateKeyToNoon(minDate) : undefined}
          endMonth={maxDate ? dateKeyToNoon(maxDate) : undefined}
          showOutsideDays={false}
          components={{
            Chevron: ({ orientation }) =>
              orientation === "left" ? (
                <ChevronLeft aria-hidden="true" strokeWidth={1.75} className="size-5" />
              ) : (
                <ChevronRight aria-hidden="true" strokeWidth={1.75} className="size-5" />
              ),
          }}
          classNames={{
            root: "relative",
            months: "flex flex-col gap-4",
            month: "flex flex-col gap-3",
            month_caption: "flex h-10 items-center justify-center",
            caption_label: "text-body-sm text-text font-semibold",
            nav: "absolute inset-x-0 top-0 flex h-10 items-center justify-between",
            button_previous:
              "inline-flex size-10 items-center justify-center rounded-full text-text hover:bg-surface-muted focus-visible:focus-ring disabled:opacity-40",
            button_next:
              "inline-flex size-10 items-center justify-center rounded-full text-text hover:bg-surface-muted focus-visible:focus-ring disabled:opacity-40",
            month_grid: "border-collapse",
            weekdays: "flex",
            weekday: "text-caption text-text-subtle size-11 text-center font-medium",
            week: "flex",
            day: "text-body-sm size-11 p-0 text-center",
            day_button: cn(
              "inline-flex size-11 items-center justify-center rounded-full text-text",
              "hover:bg-surface-muted focus-visible:focus-ring",
              "disabled:cursor-not-allowed disabled:text-text-subtle disabled:line-through disabled:hover:bg-transparent",
            ),
            today: "font-bold text-accent",
            selected:
              "[&>button]:bg-navy-900 [&>button]:text-text-on-dark [&>button]:hover:bg-navy-800",
            range_middle:
              "bg-accent-tint [&>button]:bg-transparent [&>button]:text-text [&>button]:hover:bg-accent-soft",
            range_start: "rounded-l-full bg-accent-tint",
            range_end: "rounded-r-full bg-accent-tint",
            disabled: "",
            outside: "text-text-subtle",
          }}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-body-sm text-text flex flex-col gap-1.5 font-medium">
            Jam ambil
            <Select
              size="sm"
              aria-label="Jam ambil"
              options={options}
              value={state.pickupTime}
              onValueChange={(pickupTime) => update({ ...state, pickupTime })}
            />
          </label>
          <label className="text-body-sm text-text flex flex-col gap-1.5 font-medium">
            Jam kembali
            <Select
              size="sm"
              aria-label="Jam kembali"
              options={options}
              value={state.returnTime}
              onValueChange={(returnTime) => update({ ...state, returnTime })}
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={() => setOpen(false)}>
            Selesai
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
