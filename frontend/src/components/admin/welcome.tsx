"use client";

import Link from "next/link";
import { ROLE_LABEL, useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { menuFor } from "@/lib/admin-menu";

/** v1.0 dashboard: greeting, role/branch and quick links to the allowed menus. */
export function AdminWelcome() {
  const { admin } = useCurrentAdmin();

  if (!admin) {
    return null;
  }

  const firstName = admin.name.trim().split(/\s+/)[0] ?? admin.name;
  const links = menuFor(admin.menu).filter((item) => item.key !== "dashboard");

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-h2 text-text">Halo, {firstName}</h2>
        <p className="text-body text-text-muted mt-1">
          {ROLE_LABEL[admin.role]}
          {admin.branch ? ` · Cabang ${admin.branch.name}` : " · Semua cabang"}
        </p>
      </section>
      <section aria-labelledby="tautan-cepat">
        <h3 id="tautan-cepat" className="text-h4 text-text">
          Tautan cepat
        </h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="border-border bg-surface ease-standard hover:bg-accent-wash focus-visible:focus-ring flex h-full items-start gap-3 rounded-lg border p-4 shadow-sm transition-colors duration-(--motion-fast)"
                >
                  <span className="bg-accent-wash text-accent inline-flex size-10 shrink-0 items-center justify-center rounded-full">
                    <Icon aria-hidden="true" strokeWidth={1.75} className="size-5" />
                  </span>
                  <span>
                    <span className="text-body-sm text-text block font-semibold">{item.label}</span>
                    <span className="text-caption text-text-subtle block">{item.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
