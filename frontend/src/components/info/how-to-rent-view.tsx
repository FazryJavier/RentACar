import { CalendarSearch, CarFront, KeyRound, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { howToRent } from "@/content/how-to-rent";
import type { PublicSettings } from "@/lib/public-api";
import { InfoContainer, InfoHeader } from "./prose-page";

const ICONS = [CalendarSearch, CarFront, Wallet, KeyRound];

function hours(minutes: number): string {
  const value = Math.round((minutes / 60) * 2) / 2;
  return `${new Intl.NumberFormat("id-ID").format(value)} jam`;
}

/** Rental limits in plain words, from the public settings. */
export function rentalLimits(booking: PublicSettings["booking"]): string[] {
  return [
    `Pemesanan paling cepat ${hours(booking.min_lead_minutes)} sebelum waktu ambil.`,
    `Durasi sewa ${booking.min_days}–${booking.max_days} hari, dihitung per 24 jam.`,
    `Tanggal ambil paling jauh ${booking.max_advance_days} hari dari hari ini.`,
    `Pembayaran harus dilakukan dalam ${booking.payment_window_minutes} menit setelah pemesanan dibuat.`,
  ];
}

export function HowToRentView({ settings }: { settings: PublicSettings | null }) {
  return (
    <InfoContainer className="flex flex-col gap-16">
      <InfoHeader title={howToRent.title} lead={howToRent.lead} />

      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Langkah sewa">
        {howToRent.steps.map((step, index) => {
          const Icon = ICONS[index] ?? CarFront;
          return (
            <li
              key={step.title}
              className="bg-surface flex flex-col gap-3 rounded-lg p-6 shadow-md"
            >
              <span className="bg-accent-wash text-accent relative inline-flex size-12 items-center justify-center rounded-full">
                <Icon aria-hidden="true" strokeWidth={1.75} className="size-6" />
              </span>
              <h2 className="text-h4 text-text">
                {index + 1}. {step.title}
              </h2>
              <p className="text-body-sm text-text-muted">{step.text}</p>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 lg:grid-cols-3">
        <section aria-labelledby="documents-title" className="flex flex-col gap-3">
          <h2 id="documents-title" className="text-h3 text-text">
            Syarat dokumen
          </h2>
          <ul className="text-body text-text-muted list-disc pl-6">
            {howToRent.documents.map((item) => (
              <li key={item} className="mt-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="deposit-title" className="flex flex-col gap-3">
          <h2 id="deposit-title" className="text-h3 text-text">
            Ketentuan deposit
          </h2>
          <ul className="text-body text-text-muted list-disc pl-6">
            {howToRent.deposit.map((item) => (
              <li key={item} className="mt-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
        {settings ? (
          <section
            aria-labelledby="limits-title"
            className="flex flex-col gap-3"
            data-testid="rental-limits"
          >
            <h2 id="limits-title" className="text-h3 text-text">
              Batas pemesanan
            </h2>
            <ul className="text-body text-text-muted list-disc pl-6">
              {rentalLimits(settings.booking).map((item) => (
                <li key={item} className="mt-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg" arrow>
          <Link href="/armada">Cari mobil sekarang</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/faq">Baca FAQ</Link>
        </Button>
      </div>
    </InfoContainer>
  );
}
