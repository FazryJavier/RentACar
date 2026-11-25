"use client";

import { ChangePasswordForm } from "@/components/auth/profile-forms";
import { ROLE_LABEL, useCurrentAdmin } from "@/hooks/useCurrentAdmin";

export function AdminProfile() {
  const { admin } = useCurrentAdmin();

  if (!admin) {
    return null;
  }

  const rows = [
    ["Nama", admin.name],
    ["Email", admin.email],
    ["Peran", ROLE_LABEL[admin.role]],
    ["Cabang", admin.branch?.name ?? "Semua cabang"],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="data-akun" className="bg-surface rounded-lg p-6 shadow-sm">
        <h2 id="data-akun" className="text-h4 text-text">
          Data akun
        </h2>
        <dl className="mt-4 flex flex-col gap-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-caption text-text-subtle">{label}</dt>
              <dd className="text-body text-text">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-caption text-text-subtle mt-4">
          Data akun admin diubah oleh Super Admin.
        </p>
      </section>
      <section aria-labelledby="ubah-sandi" className="bg-surface rounded-lg p-6 shadow-sm">
        <h2 id="ubah-sandi" className="text-h4 text-text">
          Ubah kata sandi
        </h2>
        <div className="mt-4">
          <ChangePasswordForm endpoint="/admin/me/password" />
        </div>
      </section>
    </div>
  );
}
