import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? "eatofine_admin_token";

/**
 * Decode a JWT payload WITHOUT verifying the signature (the backend does that)
 * and return true if the token is missing, malformed, or past its `exp`.
 *
 * Why here: the admin JWT is short-lived (12h). Once it expires the cookie is
 * still PRESENT, so the old `cookies.has()` check let it through — the page then
 * rendered and its server-side `adminFetch` got a 401, which surfaced as the
 * generic "Something went wrong" error boundary instead of a login redirect.
 * Reading `exp` up-front lets us bounce the user to /login BEFORE any render.
 *
 * Runs in the Edge runtime, so we base64url-decode by hand (atob) rather than
 * pull in a JWT library. A small clock-skew grace avoids logging users out a
 * second early.
 */
function isTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  const parts = token.split(".");
  if (parts.length !== 3) return true; // not a JWT → treat as invalid
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(b64)) as { exp?: number };
    if (typeof payload.exp !== "number") return false; // no exp → let the API decide
    const SKEW_SECONDS = 10;
    return Date.now() / 1000 >= payload.exp - SKEW_SECONDS;
  } catch {
    return true; // unparseable → treat as invalid
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes (e.g. the /api/admin proxy, /api/auth) manage their own auth and
  // return JSON — never redirect them to the login HTML page.
  if (pathname.startsWith("/api")) return NextResponse.next();

  const isLogin = pathname === "/login";
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const authed = !isTokenExpired(token);

  if (!authed && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    // Distinguish "you were logged in but the session expired" from "never
    // logged in", so the login page can show an appropriate message.
    if (token) url.searchParams.set("reason", "session_expired");
    const res = NextResponse.redirect(url);
    // Drop the stale/expired cookie so we don't bounce in a loop.
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
  if (authed && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except next internals, api auth, static files
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
