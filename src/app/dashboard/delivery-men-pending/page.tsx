import { adminFetch } from "../../../lib/api";
import { ApproveRejectButtons } from "../../../components/ApproveRejectButtons";

interface PendingDm {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  zone_id: number | null;
  vehicle_id: number | null;
  submitted_at: string | null;
  status: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(d) || d < 0) return "—";
  return d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export default async function DmPendingPage() {
  const data = await adminFetch<{ total: number; items: PendingDm[] }>("/admin/delivery-men/pending");
  const rows = data.items;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT · ONBOARDING
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery Man Joining Requests</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Riders who applied via the public Delivery Man signup. Verify documents (ID, driver&apos;s licence, vehicle papers) and approve to start receiving orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile label="Pending review" value={rows.length.toString()} hint="Awaiting verification" accent="amber" />
        <StatTile
          label="Submitted last 7 days"
          value={rows.filter((r) => r.submitted_at && Date.now() - new Date(r.submitted_at).getTime() < 7 * 86_400_000).length.toString()}
          accent="blue"
        />
        <StatTile label="Oldest pending" value={rows.length > 0 ? daysSince(rows[rows.length - 1].submitted_at) : "—"} accent="rose" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Pending applications</h2>
          <p className="text-xs text-slate-500 mt-0.5">{rows.length} delivery man / men awaiting your decision.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Zone / Vehicle</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-flex flex-col items-center gap-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium">No pending applications</p>
                      <p className="text-xs">All riders are processed.</p>
                    </div>
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 align-top">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>{r.email ?? "—"}</div>
                    <div className="text-slate-400">{r.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>Zone #{r.zone_id ?? "—"}</div>
                    <div className="text-slate-400">Vehicle #{r.vehicle_id ?? "—"}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>{fmtDate(r.submitted_at)}</div>
                    <div className="text-slate-400">{daysSince(r.submitted_at)}</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ApproveRejectButtons basePath="delivery-men" id={r.id} />
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

function StatTile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: "amber" | "blue" | "rose" }) {
  const palette: Record<string, string> = {
    amber: "from-amber-50/60 ring-amber-200",
    blue: "from-blue-50/60 ring-blue-200",
    rose: "from-rose-50/60 ring-rose-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
