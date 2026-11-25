"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui";
import { isActivePath, PUBLIC_NAV } from "@/lib/navigation";
import { AccountLink } from "./account-link";
import { Logo } from "./logo";
import { NavItem } from "./nav-link";

/** Full-screen navigation panel below 1024px (focus trapped, Esc closes, closes on navigation). */
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <IconButton variant="ghost" aria-label="Buka menu" aria-expanded={open}>
          <Menu aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-modal="true"
          aria-describedby={undefined}
          className="bg-surface motion-safe:animate-fade-in fixed inset-0 z-(--z-sheet) flex flex-col px-4 pt-3 pb-6 md:px-6"
        >
          <div className="flex h-16 items-center justify-between">
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <Logo />
            <DialogPrimitive.Close asChild>
              <IconButton variant="ghost" aria-label="Tutup menu">
                <X aria-hidden="true" strokeWidth={1.75} />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Menu utama" className="mt-4 flex-1 overflow-y-auto">
            <ul>
              {PUBLIC_NAV.map((item) => (
                <li key={item.href}>
                  <NavItem
                    href={item.href}
                    label={item.label}
                    active={isActivePath(pathname, item.href)}
                    variant="mobile"
                    onNavigate={close}
                  />
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3 pt-4">
            <AccountLink onNavigate={close} variant="list" className="w-full" />
            <Button asChild size="lg" fullWidth arrow>
              <Link href="/armada" onClick={close}>
                Sewa Sekarang
              </Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
