import { adminFetch } from "../../../lib/api";
import { AssignDmButton } from "./DispatchActions";

interface DispatchOrder {
  id: number;
  customer: string;
  restaurant: string;
  order_amount: number;
  address: string;
  wait_minutes: number;
  assigned_to: number | null;
}
interface DM { id: number; f_name: string | null; l_name: string | null; status: boolean; application_status: string | null }
// Endpoint returns `delivery_men`; older code may use `items` — handle both safely.
type DmListResponse = { delivery_men?: DM[]; items?: DM[] };

function waitBadge(mins: number) {
  if (mins < 5) return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "bg-emerald-500" };
  if (mins < 10) return { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: "bg-amber-500" };
  return { cls: "bg-rose-50 text-rose-700 border-rose-200", icon: "bg-rose-500" };
}

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams;
  const type = sp.type ?? "searching";
  const [orders, dms] = await Promise.all([
    adminFetch<{ total: number; type: string; items: DispatchOrder[] }>(`/admin/dispatch?type=${type}`),
    adminFetch<DmListResponse>("/admin/delivery-men?limit=100"),
  ]);
  const dmList = dms.delivery_men ?? dms.items ?? [];
  const activeDms = dmList
    .filter((d) => d.status && d.application_status === "approved")
    .map((d) => ({ id: d.id, name: `${d.f_name ?? ""} ${d.l_name ?? ""}`.trim() || `DM #${d.id}` }));

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> ORDER MANAGEMENT · DISPATCH
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Dispatch Management</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Orders awaiting a delivery man. Pick a rider for each pickup or watch ongoing deliveries.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabLink active={type === "searching"} href="/dashboard/dispatch?type=searching" count={type === "searching" ? orders.total : null}>Searching for DM</TabLink>
        <TabLink active={type === "ongoing"} href="/dashboard/dispatch?type=ongoing" count={type === "ongoing" ? orders.total : null}>On-going</TabLink>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{type === "ongoing" ? "On-going deliveries" : "Pending pickup"}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{orders.total} order(s) · {activeDms.length} active riders available.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Wait</th>
                <th className="px-4 py-3 font-semibold text-right">{type === "ongoing" ? "Status" : "Assign"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.items.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No orders in this state. 🎉</td></tr>
              ) : orders.items.map((o) => {
                const wb = waitBadge(o.wait_minutes);
                return (
                  <tr key={o.id} className="hover:bg-emerald-50/40">
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">#{o.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{o.restaurant}</td>
                    <td className="px-4 py-3 text-slate-700">{o.customer}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{o.address}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{o.order_amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${wb.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${wb.icon}`} />
                        {o.wait_minutes} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {type === "ongoing" ? (
                        <span className="text-xs text-slate-500">DM #{o.assigned_to ?? "?"} en-route</span>
                      ) : (
                        <AssignDmButton orderId={o.id} deliveryMen={activeDms} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabLink({ active, href, count, children }: { active: boolean; href: string; count: number | null; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
      {count !== null && (
        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1.5 ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
          {count}
        </span>
      )}
    </a>
  );
}
