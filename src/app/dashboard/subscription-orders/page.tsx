import { adminFetch } from "../../../lib/api";
import { ActionButton } from "../../../components/ActionButton";
import { SubscriptionConfigPanel } from "../../../components/SubscriptionConfigPanel";

interface Sub {
  id: number;
  customer: string;
  restaurant: string;
  plan: string;
  frequency: string;
  status: string;
  start_date: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default async function SubscriptionOrdersPage() {
  const data = await adminFetch<{ total: number; items: Sub[] }>("/admin/subscription-orders");
  const rows = data.items;
  const active = rows.filter((r) => r.status === "active");
  const paused = rows.filter((r) => r.status === "paused");

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> ORDER MANAGEMENT · SUBSCRIPTIONS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Subscription Orders</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Long-term recurring meal plans. Customers subscribe to daily / weekly deliveries from a chosen restaurant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Active plans" value={active.length.toString()} accent="emerald" />
        <StatTile label="Paused" value={paused.length.toString()} accent="amber" />
        <StatTile label="Total subscriptions" value={rows.length.toString()} accent="blue" />
        <StatTile label="Unique customers" value={new Set(rows.map((r) => r.customer)).size.toString()} accent="slate" />
      </div>

      {/* User subscription configuration option */}
      <SubscriptionConfigPanel />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">All subscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Frequency</th>
                <th className="px-4 py-3 font-semibold">Started</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No subscription orders yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.customer}</td>
                  <td className="px-4 py-3 text-slate-700">{r.restaurant}</td>
                  <td className="px-4 py-3 text-slate-700">{r.plan}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.frequency}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.start_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${
                      r.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      r.status === "paused" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        r.status === "active" ? "bg-emerald-500" :
                        r.status === "paused" ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {r.status === "canceled" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <>
                          {r.status === "paused" ? (
                            <ActionButton path={`/subscription-orders/${r.id}/status`} method="PATCH" body={{ status: "active" }} label="Resume" variant="primary" />
                          ) : (
                            <ActionButton path={`/subscription-orders/${r.id}/status`} method="PATCH" body={{ status: "paused" }} label="Pause" variant="subtle" />
                          )}
                          <ActionButton path={`/subscription-orders/${r.id}/status`} method="PATCH" body={{ status: "canceled" }} label="Cancel" variant="danger" confirm="Cancel this subscription?" />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "emerald" | "amber" | "blue" | "slate" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    amber: "from-amber-50/60 ring-amber-200",
    blue: "from-blue-50/60 ring-blue-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
