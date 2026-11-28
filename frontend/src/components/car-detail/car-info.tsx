import { Calendar, Check, Fuel, Luggage, Palette, Settings2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/components/fleet/labels";
import { formatRupiah } from "@/lib/format";
import type { PublicCarDetail } from "@/lib/public-api";

function Spec({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface flex items-center gap-3 rounded-md p-3 shadow-sm">
      <span className="text-accent [&_svg]:size-5" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col">
        <dt className="text-caption text-text-subtle">{label}</dt>
        <dd className="text-body-sm text-text font-medium">{value}</dd>
      </div>
    </div>
  );
}

/** Specification grid, features, description and rental terms. */
export function CarInfo({ car }: { car: PublicCarDetail }) {
  return (
    <>
      <section aria-labelledby="spesifikasi" className="flex flex-col gap-4">
        <h2 id="spesifikasi" className="text-h3 text-text">
          Spesifikasi
        </h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Spec icon={<Calendar strokeWidth={1.75} />} label="Tahun" value={String(car.year)} />
          <Spec
            icon={<Settings2 strokeWidth={1.75} />}
            label="Transmisi"
            value={TRANSMISSION_LABEL[car.transmission]}
          />
          <Spec icon={<Users strokeWidth={1.75} />} label="Kursi" value={`${car.seats} kursi`} />
          <Spec
            icon={<Fuel strokeWidth={1.75} />}
            label="Bahan bakar"
            value={FUEL_LABEL[car.fuel_type]}
          />
          <Spec
            icon={<Luggage strokeWidth={1.75} />}
            label="Bagasi"
            value={car.luggage_capacity !== null ? `${car.luggage_capacity} koper` : "—"}
          />
          <Spec icon={<Palette strokeWidth={1.75} />} label="Warna" value={car.color} />
        </dl>
        {car.description ? <p className="text-body text-text-muted">{car.description}</p> : null}
      </section>

      {car.features.length > 0 ? (
        <section aria-labelledby="fasilitas" className="flex flex-col gap-4">
          <h2 id="fasilitas" className="text-h3 text-text">
            Fasilitas
          </h2>
          <ul className="flex flex-wrap gap-2">
            {car.features.map((feature) => (
              <li
                key={feature}
                className="bg-surface text-body-sm text-text flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm"
              >
                <Check aria-hidden="true" strokeWidth={1.75} className="text-success size-4" />
                {feature}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="syarat-sewa" className="flex flex-col gap-4">
        <h2 id="syarat-sewa" className="text-h3 text-text">
          Syarat sewa
        </h2>
        <Accordion type="multiple" className="bg-surface rounded-lg px-4 shadow-sm">
          <AccordionItem value="dokumen">
            <AccordionTrigger>Dokumen</AccordionTrigger>
            <AccordionContent>
              KTP dan SIM A yang masih berlaku atas nama penyewa, ditunjukkan saat pengambilan.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="deposit">
            <AccordionTrigger>Deposit</AccordionTrigger>
            <AccordionContent>
              Deposit {formatRupiah(car.deposit)} dibayar bersama biaya sewa dan dikembalikan
              setelah mobil kembali dalam kondisi baik (simulasi).
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="durasi">
            <AccordionTrigger>Durasi & jadwal</AccordionTrigger>
            <AccordionContent>
              Sewa 1–30 hari, dipesan paling cepat 2 jam dan paling lambat 90 hari sebelumnya,
              diambil dan dikembalikan pada jam operasional cabang.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="demo">
            <AccordionTrigger>Catatan demo</AccordionTrigger>
            <AccordionContent>
              Situs ini adalah proyek demo. Semua pemesanan dan pembayaran adalah simulasi.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </>
  );
}
