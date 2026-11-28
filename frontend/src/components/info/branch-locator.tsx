"use client";

import { Clock, MapPin, Phone } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Skeleton } from "@/components/ui";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PublicBranch } from "@/lib/public-api";
import type { BranchMapHandle } from "./branch-map";

// Leaflet needs `window`; it loads only in the browser, once the map area is near the viewport.
const BranchMap = dynamic(() => import("./branch-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Branch cards (the accessible path) with a supplementary interactive map. */
export function BranchLocator({ branches }: { branches: PublicBranch[] }) {
  const reducedMotion = useReducedMotion();
  const area = useRef<HTMLDivElement>(null);
  const handle = useRef<BranchMapHandle | null>(null);
  const pending = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);
  const onReady = useCallback((next: BranchMapHandle) => {
    handle.current = next;
    if (pending.current) {
      next.focus(pending.current);
      pending.current = null;
    }
  }, []);

  useEffect(() => {
    const element = area.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function showOnMap(slug: string) {
    setVisible(true);
    area.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    if (handle.current) {
      handle.current.focus(slug);
    } else {
      pending.current = slug;
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div
        ref={area}
        role="region"
        aria-label="Peta cabang (pelengkap daftar di bawah)"
        className="border-border bg-surface-muted relative z-0 h-80 overflow-hidden rounded-lg border lg:h-120"
      >
        {visible ? (
          <BranchMap branches={branches} reducedMotion={reducedMotion} onReady={onReady} />
        ) : (
          <Skeleton className="size-full rounded-none" />
        )}
      </div>

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Daftar cabang">
        {branches.map((branch) => (
          <li key={branch.slug} className="bg-surface flex flex-col gap-4 rounded-lg p-6 shadow-md">
            <h2 className="text-h4 text-text">{branch.name}</h2>
            <dl className="text-body-sm text-text-muted flex flex-col gap-2">
              <div className="flex gap-2">
                <dt>
                  <MapPin aria-hidden="true" strokeWidth={1.75} className="text-accent size-5" />
                  <span className="sr-only">Alamat</span>
                </dt>
                <dd>
                  {branch.address}, {branch.city}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>
                  <Clock aria-hidden="true" strokeWidth={1.75} className="text-accent size-5" />
                  <span className="sr-only">Jam operasional</span>
                </dt>
                <dd>
                  {branch.opening_time}–{branch.closing_time} WIB
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>
                  <Phone aria-hidden="true" strokeWidth={1.75} className="text-accent size-5" />
                  <span className="sr-only">Telepon</span>
                </dt>
                <dd>
                  <a
                    href={telHref(branch.phone)}
                    className="text-accent hover:text-accent-hover focus-visible:focus-ring rounded-sm underline"
                  >
                    {branch.phone}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-auto flex flex-wrap gap-3">
              <Button asChild size="md" arrow>
                <Link href={`/armada?branch=${encodeURIComponent(branch.slug)}`}>
                  Lihat armada cabang ini
                </Link>
              </Button>
              <Button variant="ghost" size="md" onClick={() => showOnMap(branch.slug)}>
                Lihat di peta
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
