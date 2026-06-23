import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { ActionButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface Restaurant {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: boolean;
  active: boolean;
  logo: string | null;
  zone_id: number | null;
  vendor_id: number;
  comission: number | null;
  minimum_order: number;
  restaurant_model: string | null;
  order_count: number;
  created_at: string | null;
}

interface RestaurantsResponse {
  total: number;
  restaurants: Restaurant[];
}

const STORAGE_BASE = "http://192.168.0.159:3000/storage/restaurant/";

export default async function RestaurantsPage() {
  const data = await adminFetch<RestaurantsResponse>("/admin/restaurants?limit=500");
  const restaurants = data.restaurants;
  const activeCount = restaurants.filter((r) => r.status).length;
  const inactiveCount = restaurants.length - activeCount;
  const openNow = restaurants.filter((r) => r.active).length;
  const totalOrders = restaurants.reduce((s, r) => s + (r.order_count || 0), 0);
  const avgCommission = restaurants.length > 0
    ? restaurants.reduce((s, r) => s + (r.comission || 0), 0) / restaurants.length
    : 0;

  const modelCounts = new Map<string, number>();
  for (const r of restaurants) {
    const k = (r.restaurant_model || "unset").toLowerCase();
    modelCounts.set(k, (modelCounts.get(k) || 0) + 1);
  }
  const modelPalette: Record<string, string> = {
    commission: DONUT_PALETTE.emerald,
    subscription: DONUT_PALETTE.teal,
    none: DONUT_PALETTE.amber,
    unset: DONUT_PALETTE.slate,
  };
  const slices = Array.from(modelCounts.entries()).map(([k, v]) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    color: modelPalette[k] || DONUT_PALETTE.indigo,
  }));

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Restaurant management · Storefronts
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Restaurants</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              View and manage every restaurant on the platform — edit their details, commission and settings, or enable and disable each storefront.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">On platform</div>
            <div className="text-lg font-bold tabular-nums">{data.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{openNow} open · {activeCount} active</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total restaurants" value={data.total.toLocaleString("en-IN")} suffix={`Showing ${restaurants.length}`} accent="emerald" />
        <StatCard label="Open right now" value={openNow.toString()} suffix={restaurants.length > 0 ? `${Math.round((openNow / restaurants.length) * 100)}% live` : "—"} accent="teal" />
        <StatCard label="Total orders" value={totalOrders.toLocaleString("en-IN")} suffix="across all stores" accent="emerald" />
        <StatCard label="Avg commission" value={avgCommission > 0 ? `${avgCommission.toFixed(1)}%` : "—"} suffix={`${inactiveCount} disabled`} accent="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Business model split</h3>
          <p className="text-xs text-slate-500 mt-0.5">Commission vs subscription vs unset.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Stores" centerValue={restaurants.length} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>
        </div>

        <PaginatedTable
          headerRow={
            <tr>
              <th className="px-6 py-3 font-semibold">Restaurant</th>
              <th className="px-6 py-3 font-semibold">Contact</th>
              <th className="px-6 py-3 font-semibold">Model</th>
              <th className="px-6 py-3 font-semibold text-right">Commission</th>
              <th className="px-6 py-3 font-semibold text-right">Orders</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          }
          bodyRows={restaurants.map((r) => {
            const m = (r.restaurant_model || "unset").toLowerCase();
            const modelColor = m === "commission" ? "emerald" : m === "subscription" ? "teal" : "slate";
            const modelClasses: Record<string, string> = {
              emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
              teal: "bg-teal-50 text-teal-700 border-teal-200",
              slate: "bg-slate-100 text-slate-600 border-slate-200",
            };
            return (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {r.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${STORAGE_BASE}${r.logo}`} alt={r.name ?? ""} className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center text-xs font-bold">
                        {(r.name ?? "R").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/dashboard/restaurants/${r.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors block truncate">
                        {r.name ?? "—"}
                      </Link>
                      <div className="text-[11px] text-slate-500">Zone {r.zone_id ?? "—"} · #{r.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div>
                    <div className="text-slate-800 text-xs truncate max-w-[180px]">{r.email ?? "—"}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.phone ?? ""}</div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${modelClasses[modelColor]}`}>
                    {r.restaurant_model ?? "—"}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="tabular-nums text-slate-800">{r.comission !== null ? `${r.comission}%` : "—"}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span className="tabular-nums font-semibold text-slate-900">{r.order_count.toLocaleString("en-IN")}</span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-col gap-1">
                    {r.status ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Disabled
                      </span>
                    )}
                    {r.active && r.status && <span className="text-[10px] text-emerald-600 font-semibold">Open now</span>}
                  </div>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/dashboard/restaurants/${r.id}/edit`}
                      className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200"
                    >
                      Edit
                    </Link>
                    <ActionButton
                      path={`/restaurants/${r.id}`}
                      method="PATCH"
                      body={{ status: !r.status }}
                      label={r.status ? "Disable" : "Enable"}
                      variant={r.status ? "subtle" : "primary"}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
          searchTexts={restaurants.map((r) =>
            `${r.name ?? ""} ${r.email ?? ""} ${r.phone ?? ""} ${r.address ?? ""}`.toLowerCase()
          )}
          pageSize={10}
          searchable
          colCount={7}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent: "emerald" | "teal" }) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
