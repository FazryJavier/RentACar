"use client";

import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { cn } from "@/lib/cn";

type AccountLinkProps = { onNavigate?: () => void; className?: string };

/** "Masuk" for guests, the customer's first name (→ /profil) when signed in. */
export function AccountLink({ onNavigate, className }: AccountLinkProps) {
  const { status, customer } = useCurrentCustomer();
  const style = cn(buttonVariants({ variant: "ghost", size: "md" }), className);

  if (status === "loading") {
    // Reserve the space so the header does not shift when the session resolves.
    return (
      <span aria-hidden="true" className={cn(style, "invisible")}>
        Masuk
      </span>
    );
  }

  if (status === "signed-in") {
    const firstName = customer.name.trim().split(/\s+/)[0] ?? customer.name;

    return (
      <Link href="/profil" aria-label={`Akun ${firstName}`} onClick={onNavigate} className={style}>
        <CircleUserRound aria-hidden="true" strokeWidth={1.75} />
        <span className="max-w-32 truncate">{firstName}</span>
      </Link>
    );
  }

  return (
    <Link href="/masuk" onClick={onNavigate} className={style}>
      Masuk
    </Link>
  );
}
