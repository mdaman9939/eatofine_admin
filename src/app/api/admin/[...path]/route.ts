import { NextResponse } from "next/server";
import { getAdminToken, API_URL } from "../../../../lib/api";

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const token = await getAdminToken();
  if (!token) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const { path } = await params;
  const url = new URL(req.url);
  const targetUrl = `${API_URL}/admin/${path.join("/")}${url.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }
  const upstream = await fetch(targetUrl, init);
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
