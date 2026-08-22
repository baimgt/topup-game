import { NextRequest, NextResponse } from "next/server";

// Edge-compatible JWT decode with proper Base64 padding & UTF-8 decoding
function decodeJwtPayload(token: string): { userId: string; email: string; role: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    try {
      const parts = token.split(".");
      let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4 !== 0) {
        base64 += "=";
      }
      const payload = JSON.parse(atob(base64));
      if (payload.exp && Date.now() / 1000 > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }
}

function getValidToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined") {
    return cookieToken;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.substring(7).trim();
    if (bearer && bearer !== "null" && bearer !== "undefined") {
      return bearer;
    }
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── 1. Proteksi halaman Admin (/admin/*) ────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const token = getValidToken(req);

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
    const token = getValidToken(req);

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
    const token = getValidToken(req);

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
