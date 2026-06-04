import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Zone {
  id: number;
  name: string;
  display_name: string | null;
  status: boolean;
  is_default: boolean;
  minimum_shipping_charge: number | null;
  per_km_shipping_charge: number | null;
  maximum_shipping_charge: number | null;
  minimum_delivery_time: number | null;
  max_cod_order_amount: number | null;
  restaurant_count: number;
}

function inr(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

export default async function ZonesPage() {
  const data = await adminFetch<{ zones: Zone[] }>("/admin/zones");
  const zones = data.zones;

  const activeCount = zones.filter((z) => z.status).length;
  const totalRestaurants = zones.reduce((s, z) => s + (z.restaurant_count || 0), 0);
  const avgPerKm = avg(zones.map((z) => z.per_km_shipping_charge));
  const avgEta = avg(zones.map((z) => z.minimum_delivery_time));
  const sorted = [...zones].sort((a, b) => Number(b.is_default) - Number(a.is_default) || b.restaurant_count - a.restaurant_count);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Restaurant management · Geo coverage
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery zones</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Zones gate which restaurants are visible to which customers and set the base shipping math —
              minimum order ship fee, per-km add-on, and the ETA shown at checkout.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Coverage</div>
              <div className="text-lg font-bold tabular-nums">{zones.length} {zones.length === 1 ? "zone" : "zones"}</div>
              <div className="text-[11px] text-white/70">{totalRestaurants} restaurants on platform</div>
            </div>
            <CreateForm
              path="/zones"
              title="New zone"
              fields={[
                { name: "name", label: "Zone name", type: "text", required: true, placeholder: "e.g. Bengaluru / Whitefield" },
                { name: "display_name", label: "Display name (optional)", type: "text", placeholder: "Customer-facing label" },
                { name: "minimum_shipping_charge", label: "Min ship ₹", type: "number", required: true, defaultValue: 20 },
                { name: "per_km_shipping_charge", label: "Per-km charge ₹", type: "number", required: true, defaultValue: 6 },
                { name: "maximum_shipping_charge", label: "Max ship cap ₹", type: "number", required: true, defaultValue: 200 },
                { name: "minimum_delivery_time", label: "Min ETA (minutes)", type: "number", required: true, defaultValue: 30 },
                { name: "max_cod_order_amount", label: "Max COD order ₹", type: "number", defaultValue: 5000 },
                { name: "is_default", label: "Set as default zone", type: "checkbox" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total zones"
          value={zones.length.toString()}
          suffix={`${activeCount} active`}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active zones"
          value={activeCount.toString()}
          suffix={zones.length > 0 ? `${Math.round((activeCount / zones.length) * 100)}% live` : "no zones yet"}
          accent="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Restaurants covered"
          value={totalRestaurants.toString()}
          suffix={zones.length > 0 ? `${(totalRestaurants / Math.max(1, zones.length)).toFixed(1)} avg / zone` : "—"}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M5 7v13a1 1 0 001 1h12a1 1 0 001-1V7M9 11h6" />
            </svg>
          }
        />
        <StatCard
          label="Avg per-km / ETA"
          value={avgPerKm !== null ? `₹${avgPerKm.toFixed(0)}` : "—"}
          suffix={avgEta !== null ? `${avgEta.toFixed(0)} min avg ETA` : "no ETA set"}
          accent="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Zones table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Configured zones</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Disabling a zone hides every restaurant inside it from the customer apps — without deleting any data.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {zones.length} {zones.length === 1 ? "zone" : "zones"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold text-right">Restaurants</th>
                <th className="px-4 py-3 font-semibold text-right">Min ship</th>
                <th className="px-4 py-3 font-semibold text-right">Per km</th>
                <th className="px-4 py-3 font-semibold text-right">Max ship</th>
                <th className="px-4 py-3 font-semibold text-right">Min ETA</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((z) => {
                const display = z.display_name || z.name;
                return (
                  <tr key={z.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{z.id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{display}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {z.is_default && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Default
                              </span>
                            )}
                            {display !== z.name && (
                              <span className="text-[11px] text-slate-400 font-mono truncate">{z.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 tabular-nums">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M5 7v13a1 1 0 001 1h12a1 1 0 001-1V7M9 11h6" />
                        </svg>
                        {z.restaurant_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-800 tabular-nums">{inr(z.minimum_shipping_charge)}</td>
                    <td className="px-4 py-4 text-right text-slate-800 tabular-nums">{inr(z.per_km_shipping_charge)}</td>
                    <td className="px-4 py-4 text-right text-slate-500 tabular-nums">{inr(z.maximum_shipping_charge)}</td>
                    <td className="px-4 py-4 text-right text-slate-800 tabular-nums">
                      {z.minimum_delivery_time !== null && z.minimum_delivery_time !== undefined ? (
                        <span>{z.minimum_delivery_time}<span className="text-[11px] text-slate-400 ml-0.5">min</span></span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill active={z.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex gap-2">
                        <ToggleStatusButton basePath="/zones" id={z.id} currentStatus={z.status} />
                        {!z.is_default && <DeleteButton basePath="/zones" id={z.id} />}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {zones.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium">No delivery zones configured</p>
                      <p className="text-xs">Create at least one zone — restaurants must belong to a zone to appear in the apps.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closing card ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/10">
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="relative px-7 py-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <CalloutTile
            title="Geofence"
            body="A zone is a polygon. Customer location → polygon match → list of restaurants. No match means no restaurants are shown."
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            }
          />
          <CalloutTile
            title="Ship math"
            body="Final ship = min ship if distance is small, else per-km × km. Capped by the max ship value if set."
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            }
          />
          <CalloutTile
            title="Switching off"
            body="Disabling a zone is reversible and immediate — restaurants stay configured but disappear from customer search and checkout."
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Disabled
    </span>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: "emerald" | "teal";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
        <span className={`w-10 h-10 rounded-xl ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}

function CalloutTile({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 ring-1 ring-white/10 backdrop-blur-sm rounded-xl px-4 py-4">
      <div className="flex items-center gap-2 text-white font-semibold">
        <span className="w-7 h-7 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-white">
          {icon}
        </span>
        <span className="text-sm">{title}</span>
      </div>
      <p className="mt-2 text-xs text-white/75 leading-relaxed">{body}</p>
    </div>
  );
}
