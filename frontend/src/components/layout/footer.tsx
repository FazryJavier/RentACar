import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui";
import { FOOTER_HELP_LINKS, FOOTER_QUICK_LINKS, type NavLink } from "@/lib/navigation";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const GROUPS: { id: string; title: string; links: readonly NavLink[] }[] = [
  { id: "tautan-cepat", title: "Tautan Cepat", links: FOOTER_QUICK_LINKS },
  { id: "bantuan", title: "Bantuan", links: FOOTER_HELP_LINKS },
];

function LinkList({ links }: { links: readonly NavLink[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="text-body-sm text-text-on-dark-muted hover:text-text-on-dark focus-visible:focus-ring inline-flex min-h-11 items-center rounded-sm"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Decorative wave on top of the footer. */
function FooterWave() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      className="fill-navy-900 -mb-px block h-10 w-full md:h-16"
    >
      <path d="M0 64V32C180 4 360 0 540 16s360 40 540 32 270-28 360-40V64Z" />
    </svg>
  );
}

/** Site footer (navy): brand, link groups (accordion on mobile), simulated newsletter, demo notice. */
export function Footer() {
  return (
    <footer className="mt-auto">
      <FooterWave />
      <div className="bg-navy-900 text-text-on-dark">
        <div className="max-w-page mx-auto grid gap-10 px-4 pt-6 pb-8 md:grid-cols-2 md:px-6 lg:grid-cols-4 xl:px-8">
          <div className="flex flex-col gap-4">
            <Logo tone="on-dark" />
            <p className="text-body-sm text-text-on-dark-muted">
              Sewa mobil mudah dengan harga transparan. Situs ini adalah proyek demo; semua
              transaksi simulasi.
            </p>
            <p className="text-caption text-text-on-dark-muted">
              Ikuti kami (demo): Instagram · TikTok · YouTube
            </p>
          </div>

          {GROUPS.map((group) => (
            <div key={group.id} className="hidden md:block">
              <h2 className="text-h4 text-text-on-dark">{group.title}</h2>
              <div className="mt-3">
                <LinkList links={group.links} />
              </div>
            </div>
          ))}

          <div className="md:hidden">
            <Accordion
              type="multiple"
              className="[&_button]:text-text-on-dark [&_div]:border-navy-700"
            >
              {GROUPS.map((group) => (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger>{group.title}</AccordionTrigger>
                  <AccordionContent>
                    <LinkList links={group.links} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-h4 text-text-on-dark">Newsletter</h2>
            <div className="mt-3">
              <NewsletterForm />
            </div>
          </div>
        </div>
        <div className="border-navy-700 border-t">
          <p className="max-w-page text-caption text-text-on-dark-muted mx-auto px-4 py-4 md:px-6 xl:px-8">
            © 2026 RentACar — Proyek demo
          </p>
        </div>
      </div>
    </footer>
  );
}
