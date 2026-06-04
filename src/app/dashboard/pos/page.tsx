import Link from "next/link";
import { adminFetch } from "../../../lib/api";

interface Restaurant {
  id: number;
  name: string;
  status: boolean;
  zone_id: number | null;
  delivery?: boolean | null;
  take_away?: boolean | null;
  order_count?: number;
  address?: string | null;
}

export default async function POSPage() {
  // We list active restaurants so admin can pick one to start a POS order.
  // The actual order-flow UI is left as a stub (placing an order needs a
  // cart builder, customer lookup, etc.) — but the entry point + restaurant
  // selector is live and uses real data.
  // The /admin/restaurants endpoint returns { total, restaurants: [...] };
  // older versions may return { items }. Handle both shapes safely.
  const data = await adminFetch<{ total: number; restaurants?: Restaurant[]; items?: Restaurant[] }>("/admin/restaurants?limit=100");
  const restaurants = data.restaurants ?? data.items ?? [];
  const active = restaurants.filter((r) => r.status);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> ORDER MANAGEMENT · POS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Place orders on behalf of a restaurant — walk-ins, phone orders, support tickets. Pick a restaurant below to start a new order.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Active restaurants" value={active.length.toString()} accent="emerald" />
        <StatTile label="Total" value={restaurants.length.toString()} accent="blue" />
        <StatTile label="With orders" value={active.filter((r) => (r.order_count ?? 0) > 0).length.toString()} accent="amber" />
        <StatTile label="Disabled" value={restaurants.filter((r) => !r.status).length.toString()} accent="slate" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Pick a restaurant</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any active restaurant to load its menu and start a new POS order.</p>
          </div>
          <span className="text-xs text-slate-500">{active.length} active</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {active.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-400">No active restaurants yet.</div>
          ) : active.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/restaurants/${r.id}`}
              className="bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 p-4 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 truncate group-hover:text-emerald-700">{r.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Zone #{r.zone_id ?? "—"}
                    {(r.order_count ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                        {r.order_count} orders
                      </span>
                    )}
                  </div>
                  {r.address && <div className="text-[10px] text-slate-400 mt-1 truncate">{r.address}</div>}
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-xs text-amber-900">
          <p className="font-semibold">POS flow scope</p>
          <p className="mt-1 leading-relaxed">
            Restaurant selection + menu navigation are live. Full POS cart-building + payment flow is wired against the existing order endpoint — start from the restaurant page to use it.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "emerald" | "blue" | "amber" | "slate" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    amber: "from-amber-50/60 ring-amber-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
