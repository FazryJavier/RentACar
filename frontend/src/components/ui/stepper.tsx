import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type StepperProps = {
  steps: readonly string[];
  /** 1-based index of the current step. */
  current: number;
  className?: string;
};

/** Checkout stepper: full steps from `md`, compact text + progress bar below. */
export function Stepper({ steps, current, className }: StepperProps) {
  const total = steps.length;
  const currentLabel = steps[current - 1] ?? "";

  return (
    <nav aria-label="Langkah pemesanan" className={className}>
      <div className="md:hidden">
        <p className="text-body-sm text-text font-semibold">
          Langkah {current} dari {total} — {currentLabel}
        </p>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current}
          aria-valuetext={`Langkah ${current} dari ${total}`}
          className="bg-border mt-2 h-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-accent h-full rounded-full"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
      </div>
      <ol className="hidden items-center md:flex">
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;

          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex flex-1 items-center gap-3 last:flex-none"
            >
              <span
                className={cn(
                  "text-body-sm inline-flex size-8 shrink-0 items-center justify-center rounded-full font-semibold",
                  done ? "bg-navy-900 text-text-on-dark" : null,
                  active ? "bg-accent text-text-on-dark" : null,
                  !done && !active ? "border-border-strong text-text-subtle border" : null,
                )}
              >
                {done ? <Check aria-hidden="true" strokeWidth={2.5} className="size-4" /> : number}
              </span>
              <span
                className={cn(
                  "text-body-sm whitespace-nowrap",
                  active || done ? "text-text font-semibold" : "text-text-subtle",
                )}
              >
                {label}
                {done ? <span className="sr-only"> (selesai)</span> : null}
              </span>
              {number < total ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-3 h-0.5 flex-1 rounded-full",
                    done ? "bg-navy-900" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
