import { cookies } from "next/headers";

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME ?? "eatofine_admin_token";
const API_URL = process.env.NODE_API_URL ?? "https://eatofine-backend.onrender.com/api/v1";

export async function getAdminToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function adminFetch<T>(path: string): Promise<T> {
  const token = await getAdminToken();
  if (!token) {
    throw new Error("not_authenticated");
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`api_error_${res.status}`);
  }
  return (await res.json()) as T;
}

export async function adminMutate<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const token = await getAdminToken();
  if (!token) throw new Error('not_authenticated');
  const res = await fetch(`${API_URL}${path}`, {
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
