import { NextRequest, NextResponse } from "next/server";

// Edge-compatible JWT decode (middleware runs in Edge Runtime, not full Node.js)
// We decode the payload manually without verifying signature here —
// The actual signature verification happens in route handlers via jsonwebtoken.
// This is acceptable because:
// 1. Middleware is a UX/access control gate (fast redirect)
// 2. All actual data mutations require re-verification in route handlers
// 3. A forged JWT with wrong signature will fail in route handlers anyway
function decodeJwtPayload(token: string): { userId: string; email: string; role: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── 1. Proteksi halaman Admin (/admin/*) ────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const user = decodeJwtPayload(token);
    if (!user || user.role !== "ADMIN") {
      const homeUrl = new URL("/", req.url);
      homeUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  }

  // ─── 2. Double-guard API Admin (/api/admin/*) ────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Token diperlukan" },
        { status: 401 }
      );
    }

    const user = decodeJwtPayload(token);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Hanya Admin yang dapat mengakses" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // ─── 3. Proteksi API User (/api/user/*) ──────────────────────────────────
  if (pathname.startsWith("/api/user")) {
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Login diperlukan" },
        { status: 401 }
      );
    }

    const user = decodeJwtPayload(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Token tidak valid atau kadaluarsa" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/user/:path*",
  ],
};
