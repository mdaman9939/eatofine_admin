import { cookies } from "next/headers";

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? "eatofine_admin_token";
const API_URL = process.env.NODE_API_URL ?? "http://127.0.0.1:3000/api/v1";
// The backend may cold-start on Render's free tier (first request after idle can
// take 30–60s). Use a generous timeout so requests don't hang forever, and let
// idempotent GETs retry once so a cold start doesn't surface as a hard error.
const REQUEST_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 60000);

export async function getAdminToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function adminFetch<T>(path: string): Promise<T> {
  const token = await getAdminToken();
  if (!token) {
    throw new Error("not_authenticated");
  }
  const init: RequestInit = {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  };
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_URL}${path}`, init);
  } catch {
    // One retry to absorb a backend cold start / transient network blip (GET is idempotent).
    res = await fetchWithTimeout(`${API_URL}${path}`, init);
  }
  if (!res.ok) {
    throw new Error(`api_error_${res.status}`);
  }
  return (await res.json()) as T;
}

export async function adminMutate<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const token = await getAdminToken();
  if (!token) throw new Error('not_authenticated');
  // No automatic retry for mutations — they are not idempotent.
  const res = await fetchWithTimeout(`${API_URL}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`api_error_${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { COOKIE_NAME, API_URL };
