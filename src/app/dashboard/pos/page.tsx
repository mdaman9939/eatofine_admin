import { adminFetch } from "../../../lib/api";
import { PosBoard, type PosZone, type PosRestaurant, type PosCategory } from "../../../components/PosBoard";

interface Restaurant { id: number; name: string; status: boolean; zone_id: number | null }

export default async function POSPage() {
  // StackFood-style POS: Food Section (zone → restaurant → categories) on the
  // left, Billing Section on the right. We seed the zone/restaurant/category
  // selects here; the menu loads client-side when a restaurant is chosen.
  const [restRes, zonesRes, catsRes, gstRes, chargesRes, gstTypesRes] = await Promise.all([
    adminFetch<{ restaurants?: Restaurant[]; items?: Restaurant[] }>("/admin/restaurants?limit=500").catch(() => ({} as { restaurants?: Restaurant[]; items?: Restaurant[] })),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ items?: Array<{ id: number; name: string | null }>; categories?: Array<{ id: number; name: string | null }> }>("/admin/categories?limit=300").catch(() => ({} as { items?: Array<{ id: number; name: string | null }>; categories?: Array<{ id: number; name: string | null }> })),
    // Platform food-GST rate (sec 9(5)) — collected by the admin, not the restaurant.
    adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=food_gst_rate").catch(() => ({ settings: [] as Array<{ key: string; value: string | null }> })),
    // Legacy toggle — only used to derive the default when food_gst_order_types is unset.
    adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=charges_on_takeaway_dinein").catch(() => ({ settings: [] as Array<{ key: string; value: string | null }> })),
    // Which order types food GST + extra packaging apply to (Additional Charges screen).
    adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=food_gst_order_types").catch(() => ({ settings: [] as Array<{ key: string; value: string | null }> })),
  ]);
  const foodGstRate = (() => {
    const v = gstRes.settings.find((s) => s.key === "food_gst_rate")?.value;
    const n = v != null ? parseFloat(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : 5;
  })();
  // Order types food GST + extra packaging apply to: new key wins; else default
  // from the legacy charges_on_takeaway_dinein toggle (ON → all, OFF → delivery).
  const foodGstOrderTypes = (() => {
    const raw = (gstTypesRes.settings.find((s) => s.key === "food_gst_order_types")?.value ?? "").trim();
    if (raw) return raw.split(",").map((s) => s.trim()).filter((s) => ["take_away", "dine_in", "delivery"].includes(s));
    const toggle = (chargesRes.settings.find((s) => s.key === "charges_on_takeaway_dinein")?.value ?? "").trim();
    return /^(1|true|yes|on)$/i.test(toggle) ? ["take_away", "dine_in", "delivery"] : ["delivery"];
  })();
  const restaurants: PosRestaurant[] = (restRes.restaurants ?? restRes.items ?? [])
    .filter((r) => r.status)
    .map((r) => ({ id: r.id, name: r.name, zone_id: r.zone_id }));
  const zones: PosZone[] = zonesRes.zones.map((z) => ({ id: z.id, name: z.name ?? `Zone ${z.id}` }));
  const categories: PosCategory[] = (catsRes.items ?? catsRes.categories ?? []).map((c) => ({ id: c.id, name: c.name ?? `#${c.id}` }));

  return (
    <div className="relative">
      <div className="relative overflow-hidden sidebar-gradient text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> ORDER MANAGEMENT · POS
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-sm text-white/80">Take walk-in / phone orders — pick a zone & restaurant, build the cart, place the order.</p>
        </div>
      </div>
      <PosBoard zones={zones} restaurants={restaurants} categories={categories} foodGstRate={foodGstRate} foodGstOrderTypes={foodGstOrderTypes} />
    </div>
  );
}
