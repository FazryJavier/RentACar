"use client";

import { CircleUserRound, ChevronDown, LogOut, ReceiptText, UserRound } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { buttonVariants } from "@/components/ui";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { cn } from "@/lib/cn";
import { useLogout } from "./use-logout";

type AccountLinkProps = { onNavigate?: () => void; className?: string; variant?: "menu" | "list" };

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

const itemClass =
  "text-body-sm text-text flex h-11 cursor-pointer items-center gap-3 rounded-sm px-3 outline-none data-highlighted:bg-accent-wash [&_svg]:size-5 [&_svg]:text-text-muted";

/**
 * Guests: "Masuk". Signed in: an account menu (Pemesanan Saya, Profil, Keluar), or a plain list
 * of the same actions inside the mobile menu (`variant="list"`).
 */
export function AccountLink({ onNavigate, className, variant = "menu" }: AccountLinkProps) {
  const { status, customer } = useCurrentCustomer();
  const logout = useLogout();
  const style = cn(buttonVariants({ variant: "ghost", size: "md" }), className);

  if (status === "loading") {
    // Reserve the space so the header does not shift when the session resolves.
    return (
      <span aria-hidden="true" className={cn(style, "invisible")}>
        Masuk
      </span>
    );
  }

  if (status === "guest") {
    return (
      <Link href="/masuk" onClick={onNavigate} className={style}>
        Masuk
      </Link>
    );
  }

  const name = firstName(customer.name);

  if (variant === "list") {
    const listItem =
      "text-h4 text-text flex h-14 w-full items-center gap-3 border-b border-border px-1 focus-visible:focus-ring [&_svg]:size-5 [&_svg]:text-text-muted";

    return (
      <div className={cn("flex flex-col", className)}>
        <p className="text-caption text-text-subtle px-1 pb-1">Masuk sebagai {customer.name}</p>
        <Link href="/pemesanan" onClick={onNavigate} className={listItem}>
          <ReceiptText aria-hidden="true" strokeWidth={1.75} />
          Pemesanan Saya
        </Link>
        <Link href="/profil" onClick={onNavigate} className={listItem}>
          <UserRound aria-hidden="true" strokeWidth={1.75} />
          Profil
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void logout();
          }}
          className={cn(listItem, "text-left")}
        >
          <LogOut aria-hidden="true" strokeWidth={1.75} />
          Keluar
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger aria-label={`Akun ${name}`} className={style}>
        <CircleUserRound aria-hidden="true" strokeWidth={1.75} />
        <span className="max-w-32 truncate">{name}</span>
        <ChevronDown aria-hidden="true" strokeWidth={1.75} className="text-text-muted" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="border-border bg-surface motion-safe:data-[state=open]:animate-slide-in z-(--z-dropdown) min-w-56 rounded-md border p-1 shadow-md"
        >
          <DropdownMenu.Label className="text-caption text-text-subtle truncate px-3 py-2">
            {customer.email}
          </DropdownMenu.Label>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/pemesanan">
              <ReceiptText aria-hidden="true" strokeWidth={1.75} />
              Pemesanan Saya
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href="/profil">
              <UserRound aria-hidden="true" strokeWidth={1.75} />
              Profil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="bg-border my-1 h-px" />
          <DropdownMenu.Item className={itemClass} onSelect={() => void logout()}>
            <LogOut aria-hidden="true" strokeWidth={1.75} />
            Keluar
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
