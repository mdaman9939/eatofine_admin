import { NextResponse } from "next/server";

const API_URL = process.env.NODE_API_URL ?? "http://127.0.0.1:3000/api/v1";
const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? "eatofine_admin_token";
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "email_and_password_required" },
      { status: 400 },
    );
  }
  const apiRes = await fetch(`${API_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  const data = (await apiRes.json()) as { token?: string; admin?: unknown; errors?: unknown };
  if (!apiRes.ok || !data.token) {
    return NextResponse.json(
      { error: "invalid_credentials", details: data.errors ?? null },
      { status: 401 },
    );
  }
  const res = NextResponse.json({ admin: data.admin });
  res.cookies.set(COOKIE_NAME, data.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    // Set `secure` in production so browsers refuse to send the cookie over plain HTTP.
    secure: IS_PROD,
  });
  return res;
}
