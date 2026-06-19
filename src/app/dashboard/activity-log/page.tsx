import { adminFetch } from "../../../lib/api";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface LogEntry {
  id: number;
  admin_email: string;
  action: string;
  target: string;
  ip: string | null;
  created_at: string | null;
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function actionBadge(action: string) {
  const sensitive = /refund|delete|clean|reject|approve|password|role|disburs/i.test(action);
  if (sensitive) {
    return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">⚠ Sensitive</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">Routine</span>;
}

export default async function ActivityLogPage() {
  const data = await adminFetch<{ total: number; items: LogEntry[] }>("/admin/activity-log?limit=500");
  const logs = data.items;

  const last24h = logs.filter((l) => {
    if (!l.created_at) return false;
    return Date.now() - new Date(l.created_at).getTime() < 86_400_000;
  });
  const sensitive = logs.filter((l) => /refund|delete|clean|reject|approve|password|role|disburs/i.test(l.action));
  const admins = new Set(logs.map((l) => l.admin_email));

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · AUDIT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Read-only audit trail of sensitive admin actions — refunds, disbursements, role changes, settings updates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Events (24h)" value={last24h.length.toString()} accent="emerald" />
        <StatTile label="Sensitive actions" value={sensitive.length.toString()} accent="amber" />
        <StatTile label="Admins active" value={admins.size.toString()} accent="blue" />
        <StatTile label="Total events" value={logs.length.toString()} accent="slate" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Recent events</h2>
        <p className="text-xs text-slate-500 mt-0.5">Latest {logs.length} events, newest first.</p>
      </div>
      <PaginatedTable
        colCount={6}
        pageSize={10}
        searchable
        empty="No activity recorded."
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Admin</th>
            <th className="px-4 py-3 font-semibold">Action</th>
            <th className="px-4 py-3 font-semibold">Target</th>
            <th className="px-4 py-3 font-semibold">IP</th>
            <th className="px-4 py-3 font-semibold">Type</th>
          </tr>
        }
        searchTexts={logs.map((l) =>
          `${l.admin_email} ${l.action} ${l.target} ${l.ip ?? ""}`.toLowerCase()
        )}
        bodyRows={logs.map((l) => (
          <tr key={l.id} className="hover:bg-emerald-50/40">
            <td className="px-6 py-3 text-slate-500 text-xs">{fmtDateTime(l.created_at)}</td>
            <td className="px-4 py-3 text-slate-700 font-mono text-xs">{l.admin_email}</td>
            <td className="px-4 py-3 text-slate-900 font-medium">{l.action}</td>
            <td className="px-4 py-3 text-slate-600 text-xs">{l.target}</td>
            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{l.ip ?? "—"}</td>
            <td className="px-4 py-3">{actionBadge(l.action)}</td>
          </tr>
        ))}
      />
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
