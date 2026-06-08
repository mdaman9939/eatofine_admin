import { adminFetch } from "./api";

/** Build the report query string from incoming searchParams. Defaults to a
 *  30-day window when no explicit range/days is supplied. */
export function reportQuery(sp: Record<string, string | undefined>): URLSearchParams {
  const qs = new URLSearchParams();
  if (sp.from) qs.set("from", sp.from);
  if (sp.to) qs.set("to", sp.to);
  if (sp.days) qs.set("days", sp.days);
  if (!sp.from && !sp.days) qs.set("days", "30");
  if (sp.zone_id) qs.set("zone_id", sp.zone_id);
  if (sp.restaurant_id) qs.set("restaurant_id", sp.restaurant_id);
  return qs;
}

export interface FilterOption { value: string; label: string }

/** Fetch zone + restaurant dropdown options for the report filter bar. */
export async function reportFilterOptions(): Promise<{ zones: FilterOption[]; restaurants: FilterOption[] }> {
  const [zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>(
      "/admin/restaurants?limit=200",
    ).catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  return {
    zones: zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` })),
    restaurants: (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` })),
  };
}
