import { adminFetch } from "../../../lib/api";
import { ApproveRejectButtons } from "../../../components/ApproveRejectButtons";
import { RestaurantViewButton } from "../../../components/RestaurantViewButton";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface PendingRestaurant {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vendor_id: number | null;
  submitted_at: string | null;
  status: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

export default async function RestaurantsPendingPage() {
  const data = await adminFetch<{ total: number; items: PendingRestaurant[] }>("/admin/restaurants/pending");
  const rows = data.items;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> RESTAURANT MANAGEMENT · ONBOARDING
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Restaurant Joining Requests</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Review restaurants that signed up via the public application form. Approve to make them live, or reject with a reason — both decisions are emailed to the applicant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile label="Pending review" value={rows.length.toString()} hint="Awaiting decision" accent="amber" />
        <StatTile
          label="Submitted last 7 days"
          value={rows.filter((r) => r.submitted_at && Date.now() - new Date(r.submitted_at).getTime() < 7 * 86_400_000).length.toString()}
          accent="blue"
        />
        <StatTile label="Oldest pending" value={rows[rows.length - 1] ? daysSince(rows[rows.length - 1].submitted_at) : "—"} accent="rose" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Pending applications</h2>
        <p className="text-xs text-slate-500 mt-0.5">{rows.length} restaurant(s) awaiting your decision.</p>
      </div>
      <PaginatedTable
        colCount={6}
        pageSize={10}
        searchable
        empty="No pending applications"
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Restaurant</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Address</th>
            <th className="px-4 py-3 font-semibold">Submitted</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        }
        searchTexts={rows.map((r) => `#${r.id} ${r.name} ${r.email ?? ""} ${r.phone ?? ""} ${r.address ?? ""}`.toLowerCase())}
        bodyRows={rows.map((r) => (
          <tr key={r.id} className="hover:bg-emerald-50/40 align-top">
            <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
            <td className="px-4 py-4 font-semibold text-slate-900">{r.name}</td>
            <td className="px-4 py-4 text-slate-600 text-xs">
              <div>{r.email ?? "—"}</div>
              <div className="text-slate-400">{r.phone ?? ""}</div>
            </td>
            <td className="px-4 py-4 text-slate-600 text-xs max-w-[240px]">{r.address ?? "—"}</td>
            <td className="px-4 py-4 text-slate-600 text-xs">
              <div>{fmtDate(r.submitted_at)}</div>
              <div className="text-slate-400">{daysSince(r.submitted_at)}</div>
            </td>
            <td className="px-4 py-4 text-right">
              <div className="inline-flex items-center gap-2">
                <RestaurantViewButton id={r.id} />
                <ApproveRejectButtons basePath="restaurants" id={r.id} />
              </div>
            </td>
          </tr>
        ))}
      />
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
