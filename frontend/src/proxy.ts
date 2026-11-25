import { NextResponse, type NextRequest } from "next/server";

/** Laravel's session cookie (SESSION_COOKIE on the backend). Its presence is only a hint. */
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "rentacar-session";

/**
 * Sends visitors without a session cookie from customer-only pages to the login page.
 * The pages still verify the session with the API; this only avoids a flash of protected UI.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/masuk";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/pemesanan/:path*", "/profil/:path*", "/checkout/:path*"],
};
