import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_ALLOWED_ROUTES, getRoleHome } from "@/lib/roles";

const PROTECTED = "/dashboard";
const AUTH_ROUTES = ["/login", "/verify", "/forgot-password", "/set-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session")?.value;
  const role = request.cookies.get("role")?.value ?? "viewer";

  // Root → role home or login
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? getRoleHome(role) : "/login", request.url),
    );
  }

  // set-password / forgot-password — always allow (have their own cookie guards)
  if (
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/forgot-password")
  ) {
    return NextResponse.next();
  }

  // Protect all dashboard routes
  if (pathname.startsWith(PROTECTED) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  // Role-based route access (optimistic — full check happens server-side)
  for (const [route, allowed] of Object.entries(ROLE_ALLOWED_ROUTES)) {
    if (pathname.startsWith(route) && !allowed.includes(role as never)) {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|fonts|logo\\.png|.*\\.png$|.*\\.ico$|.*\\.otf$|site\\.webmanifest).*)",
  ],
};
