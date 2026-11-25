import { NextResponse, type NextRequest } from "next/server";
import { isAdminPanelPath } from "@/lib/auth";

/** Laravel's session cookie (SESSION_COOKIE on the backend). Its presence is only a hint. */
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "rentacar-session";

/**
 * Sends visitors without a session cookie from customer-only pages to the customer login page,
 * and from admin panel pages to the admin login page. The pages still verify the session with
 * the API; this only avoids a flash of protected UI.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (request.cookies.has(SESSION_COOKIE) || (isAdmin && !isAdminPanelPath(pathname))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = isAdmin ? "/admin/masuk" : "/masuk";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/pemesanan/:path*", "/profil/:path*", "/checkout/:path*", "/admin/:path*"],
};
