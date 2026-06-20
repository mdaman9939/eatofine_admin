import { NextResponse } from "next/server";
import { getAdminToken, API_URL } from "../../../../lib/api";

/**
 * Dedicated proxy for multipart image uploads (POST /api/admin/upload?dir=…).
 *
 * The generic [...path] proxy forces `content-type: application/json` and
 * re-encodes the body with `req.text()`, which corrupts a multipart upload
 * (drops the boundary + mangles the binary), so Multer on the backend never
 * sees the file. This more-specific segment takes precedence over [...path]
 * and forwards the body untouched with its original multipart content-type.
 */
export async function POST(req: Request) {
  const token = await getAdminToken();
  if (!token) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const url = new URL(req.url);
  const targetUrl = `${API_URL}/admin/upload${url.search}`;

  // Preserve the incoming multipart body and its content-type (boundary intact).
  const contentType = req.headers.get("content-type");
  const body = await req.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      ...(contentType ? { "content-type": contentType } : {}),
    },
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
