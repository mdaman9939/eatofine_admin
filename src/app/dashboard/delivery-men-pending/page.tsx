import { adminFetch } from "../../../lib/api";
import { DmJoiningTabs, type PendingDm, type DeniedDm } from "../../../components/DmJoiningTabs";

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(d) || d < 0) return "—";
  return d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export default async function DmPendingPage() {
  const [pendingRes, deniedRes] = await Promise.all([
    adminFetch<{ total: number; items: PendingDm[] }>("/admin/delivery-men/pending"),
    adminFetch<{ total: number; items: DeniedDm[] }>("/admin/delivery-men/denied").catch(() => ({ total: 0, items: [] as DeniedDm[] })),
  ]);
  const pending = pendingRes.items;
  const denied = deniedRes.items;

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
            Riders who applied via the public Delivery Man signup. Verify documents (ID, driver&apos;s licence, vehicle papers) and approve to start receiving orders. Switch to the <strong>Denied Deliveryman</strong> tab to review rejected applications and their profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile label="Pending review" value={pending.length.toString()} hint="Awaiting verification" accent="amber" />
        <StatTile label="Denied" value={denied.length.toString()} hint="Rejected applications" accent="rose" />
        <StatTile label="Oldest pending" value={pending.length > 0 ? daysSince(pending[pending.length - 1].submitted_at) : "—"} accent="blue" />
      </div>

      <DmJoiningTabs pending={pending} denied={denied} />
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
