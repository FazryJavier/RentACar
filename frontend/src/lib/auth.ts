/** Paths that need a signed-in customer. */
export const PROTECTED_PREFIXES = ["/pemesanan", "/profil", "/checkout"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Returns `next` only when it is a same-site relative path; anything else (absolute URLs,
 * protocol-relative `//host`, backslashes, schemes, control characters) becomes `/`.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (typeof next !== "string" || next === "") {
    return "/";
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    /[\u0000-\u001f]/.test(next)
  ) {
    return "/";
  }

  try {
    const base = "http://rentacar.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

/** `/masuk?next=<path>` for a path the visitor wanted to open. */
export function loginUrl(next: string): string {
  const target = safeNextPath(next);
  return target === "/" ? "/masuk" : `/masuk?next=${encodeURIComponent(target)}`;
}
