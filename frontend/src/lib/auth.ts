/** Paths that need a signed-in customer. */
export const PROTECTED_PREFIXES = ["/pemesanan", "/profil", "/checkout"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Paths of the admin panel that do not need a session. */
export const ADMIN_PUBLIC_PATHS = [
  "/admin/masuk",
  "/admin/lupa-kata-sandi",
  "/admin/atur-ulang-kata-sandi",
] as const;

/** `/admin` and its sub-paths, except the admin login, forgot and reset pages. */
export function isAdminPanelPath(pathname: string): boolean {
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  return (
    inAdmin &&
    !ADMIN_PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
}

/**
 * Returns `next` only when it is a same-site relative path (and, with `within`, inside that
 * section); anything else (absolute URLs, protocol-relative `//host`, backslashes, schemes,
 * control characters, other sections) becomes the fallback (`within` or `/`).
 */
export function safeNextPath(next: string | null | undefined, within?: string): string {
  const fallback = within ?? "/";

  if (typeof next !== "string" || next === "") {
    return fallback;
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    /[\u0000-\u001f]/.test(next)
  ) {
    return fallback;
  }

  try {
    const base = "http://rentacar.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) {
      return fallback;
    }
    if (within && url.pathname !== within && !url.pathname.startsWith(`${within}/`)) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** `/masuk?next=<path>` for a path the visitor wanted to open. */
export function loginUrl(next: string): string {
  const target = safeNextPath(next);
  return target === "/" ? "/masuk" : `/masuk?next=${encodeURIComponent(target)}`;
}

/** `/admin/masuk?next=<path>` for an admin panel path. */
export function adminLoginUrl(next: string): string {
  const target = safeNextPath(next, "/admin");
  return target === "/admin" ? "/admin/masuk" : `/admin/masuk?next=${encodeURIComponent(target)}`;
}
