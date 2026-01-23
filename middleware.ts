import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token")?.value ||
                        request.cookies.get("__Secure-better-auth.session_token")?.value ||
                        request.cookies.get("__secure-next-auth.session-token")?.value;

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginPath = request.nextUrl.pathname === "/admin/login";

  // Allow access to admin login page without authentication
  if (isAdminLoginPath) {
    return NextResponse.next();
  }

  // Protect other admin paths
  if (isAdminPath && !sessionCookie) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
