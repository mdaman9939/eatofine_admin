/**
 * Server-safe helper for the admin-role module list. Lives in a plain module
 * (NOT a "use client" file) so server components can call it during render —
 * importing a function out of a "use client" module and calling it on the
 * server throws ("Something went wrong").
 */
export function parseModules(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
