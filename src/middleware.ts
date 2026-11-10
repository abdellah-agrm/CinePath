import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWTCrypto, AUTH_COOKIE_NAME } from "@/lib/jwt-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const payload = token ? await verifyJWTCrypto(token) : null;

  // 1. Role-Based Access Control (RBAC) Route Guards

  // ADMIN Route Guard: /admin and subpaths
  if (pathname.startsWith("/admin")) {
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (payload.role !== "ADMIN") {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("denied", "admin_only");
      return NextResponse.redirect(homeUrl);
    }
  }

  // STAFF Route Guard: /staff and subpaths (accessible by STAFF and ADMIN)
  if (pathname.startsWith("/staff")) {
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (payload.role !== "STAFF" && payload.role !== "ADMIN") {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("denied", "staff_only");
      return NextResponse.redirect(homeUrl);
    }
  }

  // Redirect already authenticated users away from /login and /register
  if (pathname === "/login" || pathname === "/register") {
    if (payload) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
  }

  // 2. Prepare response and inject user metadata headers for downstream consumers
  const requestHeaders = new Headers(request.headers);
  if (payload) {
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-role", payload.role);
    requestHeaders.set("x-user-email", payload.email);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 3. Strict OWASP Top 10 Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );

  // Apply HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // API rate limit headers
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-RateLimit-Limit", "60");
    response.headers.set("X-RateLimit-Remaining", "59");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons).*)",
  ],
};
