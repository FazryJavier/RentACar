import Link from "next/link";
import { Badge } from "@/components/ui";
import { PHOTO_CREDITS, STATIC_CREDITS, type StaticCredit } from "@/content/credits";
import { privacy } from "@/content/privacy";
import type { PublicCredit } from "@/lib/public-api";
import { Markdown, markdownHeadings } from "./markdown";
import { ProsePage } from "./prose-page";

const DEMO = "Teks contoh — demo";
const DEFAULT_RETENTION_DAYS = 90;

const link = "text-accent hover:text-accent-hover focus-visible:focus-ring rounded-sm underline";

/** The terms text without a leading `# Title` line (the page already has its own h1). */
export function termsBody(markdown: string): string {
  return markdown.replace(/^\s*#\s+[^\r\n]*[\r\n]*/, "");
}

export function TermsView({ markdown }: { markdown: string | null }) {
  const body = markdown === null ? null : termsBody(markdown);
  return (
    <ProsePage
      title="Syarat & Ketentuan"
      lead="Aturan pemakaian layanan RentACar."
      demoLabel={DEMO}
      toc={body ? markdownHeadings(body) : []}
    >
      {body !== null ? (
        <Markdown>{body}</Markdown>
      ) : (
        <p>Syarat & ketentuan belum bisa dimuat. Silakan coba lagi beberapa saat lagi.</p>
      )}
    </ProsePage>
  );
}

export function PrivacyView({ retentionDays }: { retentionDays: number | null }) {
  const days = retentionDays ?? DEFAULT_RETENTION_DAYS;
  return (
    <ProsePage
      title={privacy.title}
      lead={privacy.lead}
      demoLabel={DEMO}
      sections={[
        {
          id: "data-yang-disimpan",
          title: "Data yang disimpan",
          body: (
            <>
              <p>Kami menyimpan data seperlunya untuk menjalankan pemesanan:</p>
              <ul>
                <li>Data akun: nama, email, nomor telepon, dan kata sandi yang di-hash.</li>
                <li>Data pemesanan: mobil, cabang, waktu sewa, harga, dan riwayat status.</li>
                <li>
                  Nomor SIM, yang wajib diisi sebelum memesan dan dicocokkan saat pengambilan.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "bukti-bayar",
          title: "Bukti bayar",
          body: (
            <p>
              Bukti transfer disimpan sebagai file privat tanpa alamat publik. File hanya bisa
              dibuka oleh pemilik pemesanan dan admin yang memverifikasi pembayaran.
            </p>
          ),
        },
        {
          id: "pelacakan-gps",
          title: "Pelacakan GPS",
          body: (
            <ul>
              <li>Yang dilacak hanya mobil sewaan, bukan ponsel atau perangkat penyewa.</li>
              <li>
                Posisi mobil hanya bisa dilihat oleh admin RentACar, tidak oleh pelanggan lain.
              </li>
              <li data-testid="gps-retention">
                Titik posisi disimpan selama {days} hari, lalu dihapus otomatis.
              </li>
              <li>
                Setiap pembukaan riwayat rute dicatat (siapa, mobil apa, dan rentang waktunya).
              </li>
            </ul>
          ),
        },
        {
          id: "cookie",
          title: "Cookie",
          body: (
            <p>
              Kami memakai cookie sesi untuk menjaga Anda tetap masuk dan melindungi formulir dari
              penyalahgunaan. Tidak ada cookie iklan atau pelacak pihak ketiga.
            </p>
          ),
        },
        {
          id: "layanan-pihak-ketiga",
          title: "Layanan pihak ketiga",
          body: (
            <p>
              Peta di halaman Cabang memuat ubin dari OpenStreetMap langsung di peramban Anda,
              sehingga alamat IP Anda terlihat oleh server OpenStreetMap.
            </p>
          ),
        },
        {
          id: "kontak",
          title: "Kontak",
          body: (
            <p>
              Pertanyaan tentang privasi dapat dikirim ke{" "}
              <a href={`mailto:${privacy.contactEmail}`} className={link}>
                {privacy.contactEmail}
              </a>{" "}
              (alamat contoh).
            </p>
          ),
        },
      ]}
    />
  );
}

function CreditRow({ credit }: { credit: StaticCredit }) {
  return (
    <li>
      <strong>{credit.name}</strong> — {credit.use}. Lisensi: {credit.license}.{" "}
      <a href={credit.url} target="_blank" rel="noopener noreferrer" className={link}>
        Sumber<span className="sr-only"> {credit.name} (tab baru)</span>
      </a>
    </li>
  );
}

export function CreditsView({ credits }: { credits: PublicCredit[] | null }) {
  return (
    <ProsePage
      title="Kredit"
      lead="Sumber dan lisensi model 3D, foto, ikon, huruf, dan peta yang dipakai di situs ini."
      sections={[
        {
          id: "model-3d",
          title: "Model 3D",
          body:
            credits && credits.length > 0 ? (
              <ul data-testid="model-credits">
                {credits.map((credit) => (
                  <li key={credit.car.slug}>
                    <Link href={`/armada/${credit.car.slug}`} className={link}>
                      {credit.car.name}
                    </Link>
                    : model dari{" "}
                    {credit.source_url ? (
                      <a
                        href={credit.source_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className={link}
                      >
                        {credit.source_name}
                        <span className="sr-only"> (tab baru)</span>
                      </a>
                    ) : (
                      credit.source_name
                    )}
                    , lisensi {credit.license}.{" "}
                    {credit.is_illustrative ? <Badge tone="neutral">Model ilustrasi</Badge> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Daftar model 3D belum tersedia.</p>
            ),
        },
        {
          id: "foto",
          title: "Foto",
          body:
            PHOTO_CREDITS.length > 0 ? (
              <ul>
                {PHOTO_CREDITS.map((credit) => (
                  <CreditRow key={credit.name} credit={credit} />
                ))}
              </ul>
            ) : (
              <p>
                Foto mobil di situs ini adalah foto contoh milik proyek demo. Sumber foto pihak
                ketiga akan dicantumkan di sini.
              </p>
            ),
        },
        {
          id: "ikon-huruf-peta",
          title: "Ikon, huruf, dan peta",
          body: (
            <ul>
              {STATIC_CREDITS.map((credit) => (
                <CreditRow key={credit.name} credit={credit} />
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}
