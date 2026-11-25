"use client";

import { Plus, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  BOOKING_STATUSES,
  BookingStatusBadge,
  BottomSheetContent,
  Button,
  Checkbox,
  Chip,
  DateRangePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  EmptyState,
  Field,
  FileDropzone,
  IconButton,
  Input,
  Pagination,
  RadioGroup,
  Select,
  Skeleton,
  Stepper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastProvider,
  useToast,
  type DateRangeValue,
} from "@/components/ui";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { formatDateTimeWib, formatRupiah } from "@/lib/format";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-6"
    >
      <h2 id={id} className="text-h3 text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-text-subtle">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const VARIANTS = ["primary", "accent", "secondary", "ghost", "light", "danger"] as const;
const SIZES = ["sm", "md", "lg"] as const;
const CITIES = [
  { value: "jakarta", label: "Jakarta Selatan" },
  { value: "bandung", label: "Bandung" },
  { value: "surabaya", label: "Surabaya", disabled: true },
];

function ToastButtons() {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast.show({ tone: "success", title: "Pemesanan dibuat", message: "Kode RC-2611-0001." })
        }
      >
        Toast berhasil
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => toast.show({ tone: "info", title: "Menunggu verifikasi" })}
      >
        Toast info
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => toast.show({ tone: "warning", title: "Sisa waktu bayar 30 menit" })}
      >
        Toast peringatan
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          toast.show({ tone: "error", title: "Gagal mengunggah", message: "Coba lagi." })
        }
      >
        Toast error
      </Button>
    </div>
  );
}

export function Gallery() {
  const reducedMotion = useReducedMotion();
  const [chips, setChips] = useState({ suv: true, mpv: false, matic: false });
  const [range, setRange] = useState<DateRangeValue>({ pickupAt: null, returnAt: null });
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const [step, setStep] = useState(2);

  return (
    <ToastProvider>
      <main className="max-w-page mx-auto flex flex-col gap-6 px-4 py-10 md:px-6 xl:px-8">
        <header className="flex flex-col gap-2">
          <Badge tone="accent" className="self-start">
            Hanya development
          </Badge>
          <h1 className="text-h1 text-text">
            Komponen <span className="text-accent">UI</span>
          </h1>
          <p className="text-body-lg text-text-muted">
            Semua komponen dasar dan state-nya. Reduced motion:{" "}
            <strong>{reducedMotion ? "aktif" : "tidak aktif"}</strong>.
          </p>
        </header>

        <Section id="typography" title="Tipografi & format">
          <p className="text-display text-text">Display</p>
          <p className="text-h1 text-text">Heading 1</p>
          <p className="text-h2 text-text">Heading 2</p>
          <p className="text-h3 text-text">Heading 3</p>
          <p className="text-h4 text-text">Heading 4</p>
          <p className="text-body-lg text-text-muted">Body large — subjudul hero.</p>
          <p className="text-body text-text">Body — isi umum.</p>
          <p className="text-body-sm text-text-muted">Body small — keterangan.</p>
          <p className="text-caption text-text-subtle">Caption — metadata.</p>
          <p className="text-price tabular text-text">
            {formatRupiah(650000)} <span className="text-body-sm text-text-muted">/ hari</span>
          </p>
          <p className="text-price-lg tabular text-text">{formatRupiah(3900000)}</p>
          <p className="text-body-sm text-text-muted">
            {formatDateTimeWib("2026-11-24T07:30:00Z")}
          </p>
        </Section>

        <Section id="buttons" title="Tombol">
          {SIZES.map((size) => (
            <Row key={size} label={`Ukuran ${size}`}>
              {VARIANTS.map((variant) =>
                variant === "light" ? (
                  <span key={variant} className="bg-navy-900 rounded-md p-2">
                    <Button variant="light" size={size}>
                      Light
                    </Button>
                  </span>
                ) : (
                  <Button key={variant} variant={variant} size={size}>
                    {variant[0]?.toUpperCase() + variant.slice(1)}
                  </Button>
                ),
              )}
            </Row>
          ))}
          <Row label="State">
            <Button arrow>Sewa Sekarang</Button>
            <Button loading>Memproses</Button>
            <Button disabled>Nonaktif</Button>
            <Button variant="secondary" disabled>
              Nonaktif
            </Button>
            <Button asChild variant="ghost">
              <a href="#buttons">Sebagai tautan</a>
            </Button>
          </Row>
          <Row label="Tombol ikon">
            <IconButton aria-label="Sebelumnya">
              <Search aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            <IconButton variant="solid" aria-label="Tambah">
              <Plus aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            <IconButton variant="ghost" aria-label="Tutup">
              <X aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            <IconButton disabled aria-label="Nonaktif">
              <X aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
          </Row>
        </Section>

        <Section id="badges" title="Badge & chip">
          <Row label="Nada">
            <Badge tone="accent">Rental Mobil Premium</Badge>
            <Badge tone="success">Berhasil</Badge>
            <Badge tone="warning">Perhatian</Badge>
            <Badge tone="danger">Error</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="neutral">Nonaktif</Badge>
            <span className="bg-navy-800 rounded-md p-2">
              <Badge tone="category">SUV</Badge>
            </span>
          </Row>
          <Row label="Status pemesanan">
            {BOOKING_STATUSES.map((status) => (
              <BookingStatusBadge key={status} status={status} />
            ))}
          </Row>
          <Row label="Chip filter">
            <Chip
              pressed={chips.suv}
              onPressedChange={(suv) => setChips({ ...chips, suv })}
              onRemove={() => setChips({ ...chips, suv: false })}
              removeLabel="Hapus filter SUV"
            >
              SUV
            </Chip>
            <Chip pressed={chips.mpv} onPressedChange={(mpv) => setChips({ ...chips, mpv })}>
              MPV
            </Chip>
            <Chip pressed={chips.matic} onPressedChange={(matic) => setChips({ ...chips, matic })}>
              Matic
            </Chip>
          </Row>
        </Section>

        <Section id="forms" title="Form">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nama lengkap" help="Sesuai SIM." required>
              <Input placeholder="Nama sesuai SIM" />
            </Field>
            <Field label="Email" error="Email wajib diisi" required>
              <Input type="email" placeholder="nama@contoh.test" />
            </Field>
            <Field label="Kota (admin, kecil)">
              <Input size="sm" placeholder="Ukuran admin 40 px" />
            </Field>
            <Field label="Nonaktif">
              <Input disabled value="Tidak bisa diubah" readOnly />
            </Field>
            <Field label="Cabang">
              <Select options={CITIES} placeholder="Pilih cabang" />
            </Field>
            <Field label="Cabang (error)" error="Cabang wajib dipilih">
              <Select options={CITIES} placeholder="Pilih cabang" />
            </Field>
            <Field label="Catatan" help="Opsional, maksimal 500 karakter.">
              <Textarea placeholder="Catatan untuk cabang" />
            </Field>
            <Field label="Metode serah terima">
              <RadioGroup
                defaultValue="branch"
                options={[
                  { value: "branch", label: "Ambil di cabang" },
                  { value: "delivery", label: "Antar ke alamat" },
                  { value: "airport", label: "Bandara (segera)", disabled: true },
                ]}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-3">
            <Checkbox label="Saya menyetujui syarat & ketentuan" />
            <Checkbox label="Tercentang" defaultChecked />
            <Checkbox label="Nonaktif" disabled />
          </div>
        </Section>

        <Section id="date-range" title="Pemilih tanggal & jam">
          <Field
            label="Tanggal sewa"
            help="Jam per 30 menit dalam jam operasional 08.00–20.00 WIB."
          >
            <DateRangePicker
              openTime="08:00"
              closeTime="20:00"
              minDate="2026-11-24"
              maxDate="2027-02-22"
              disabledDates={["2026-11-27", "2026-11-28"]}
              onChange={setRange}
            />
          </Field>
          <p className="text-body-sm text-text-muted tabular">
            Nilai: {range.pickupAt ?? "—"} → {range.returnAt ?? "—"}
          </p>
        </Section>

        <Section id="upload" title="Unggah file">
          <Field label="Bukti transfer" help="Hanya untuk simulasi; server tetap memvalidasi file.">
            <FileDropzone
              accept={["image/jpeg", "image/png"]}
              maxSize={5 * 1024 * 1024}
              typeLabel="JPG atau PNG"
              onFileChange={setFile}
            />
          </Field>
          <p className="text-body-sm text-text-muted">File terpilih: {file ? file.name : "—"}</p>
          <FileDropzone
            accept={["image/jpeg"]}
            maxSize={1024 * 1024}
            typeLabel="JPG"
            onFileChange={() => undefined}
            disabled
          />
        </Section>

        <Section id="overlays" title="Dialog, bottom sheet & toast">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="danger">Hapus mobil</Button>
              </DialogTrigger>
              <DialogContent
                title="Hapus mobil ini?"
                description="Mobil yang punya pemesanan aktif tidak bisa dihapus."
              >
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Batal</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="danger">Hapus</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Dialog form</Button>
              </DialogTrigger>
              <DialogContent size="form" title="Ubah cabang">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nama cabang">
                    <Input />
                  </Field>
                  <Field label="Kota">
                    <Select options={CITIES} />
                  </Field>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Batal</Button>
                  </DialogClose>
                  <Button>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Bottom sheet</Button>
              </DialogTrigger>
              <BottomSheetContent
                title="Penanda kondisi #2"
                description="Baret ringan di bumper depan."
              >
                <DialogClose asChild>
                  <Button fullWidth>Tutup</Button>
                </DialogClose>
              </BottomSheetContent>
            </Dialog>
          </div>
          <ToastButtons />
        </Section>

        <Section id="feedback" title="Memuat & kosong">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <EmptyState
            title="Belum ada pemesanan"
            description="Pemesanan yang Anda buat akan muncul di sini."
            action={<Button arrow>Lihat armada</Button>}
          />
        </Section>

        <Section id="navigation" title="Tab, akordeon, stepper & paginasi">
          <Tabs defaultValue="spec">
            <TabsList aria-label="Detail mobil">
              <TabsTrigger value="spec">Spesifikasi</TabsTrigger>
              <TabsTrigger value="condition">Kondisi</TabsTrigger>
              <TabsTrigger value="terms" disabled>
                Syarat
              </TabsTrigger>
            </TabsList>
            <TabsContent value="spec">Transmisi otomatis, 7 kursi, bensin.</TabsContent>
            <TabsContent value="condition">2 penanda kondisi ringan.</TabsContent>
          </Tabs>
          <Accordion type="single" collapsible>
            <AccordionItem value="q1">
              <AccordionTrigger>Apakah transaksinya sungguhan?</AccordionTrigger>
              <AccordionContent>
                Tidak. Semua pemesanan dan pembayaran adalah simulasi.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Berapa lama batas pembayaran?</AccordionTrigger>
              <AccordionContent>120 menit setelah pemesanan dibuat.</AccordionContent>
            </AccordionItem>
          </Accordion>
          <Stepper steps={["Detail sewa", "Data penyewa", "Konfirmasi"]} current={step} />
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={step <= 1}
              onClick={() => setStep(step - 1)}
            >
              Mundur
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={step >= 3}
              onClick={() => setStep(step + 1)}
            >
              Maju
            </Button>
          </div>
          <Pagination page={page} totalPages={10} onPageChange={setPage} />
        </Section>
      </main>
    </ToastProvider>
  );
}
