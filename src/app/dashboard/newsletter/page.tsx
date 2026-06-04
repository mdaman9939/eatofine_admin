import { adminFetch } from "../../../lib/api";
import { DeleteButton } from "../../../components/ActionButton";

interface Subscriber {
  id: number;
  email: string;
  source: string;
  status: string;
  created_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default async function NewsletterPage() {
  const data = await adminFetch<{ total: number; items: Subscriber[] }>("/admin/newsletter?limit=200");
  const subscribers = data.items;
  const recent30d = subscribers.filter((s) => {
    if (!s.created_at) return false;
    return Date.now() - new Date(s.created_at).getTime() < 30 * 86_400_000;
  }).length;

  // Top sources for the stats card
  const sourceCount = new Map<string, number>();
  for (const s of subscribers) sourceCount.set(s.source, (sourceCount.get(s.source) ?? 0) + 1);
  const topSource = [...sourceCount.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT · MARKETING
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Subscribed Emails</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Visitors who signed up via the public newsletter form. Use for campaign blasts and product update emails.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              "email,source,status,subscribed_at\n" +
                subscribers.map((s) => `${s.email},${s.source},${s.status},${s.created_at ?? ""}`).join("\n"),
            )}`}
            download="newsletter-subscribers.csv"
            className="rounded-xl bg-white text-emerald-700 font-semibold text-sm px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            ⬇ Export CSV
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total subscribers" value={data.total.toString()} accent="emerald" />
        <StatTile label="Last 30 days" value={recent30d.toString()} hint="New signups" accent="blue" />
        <StatTile
          label="Active"
          value={subscribers.filter((s) => s.status === "active").length.toString()}
          accent="amber"
        />
        <StatTile
          label="Top source"
          value={topSource ? topSource[0].split(" ")[0] : "—"}
          hint={topSource ? `${topSource[1]} signups` : "no data"}
          accent="slate"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Subscribers</h2>
            <p className="text-xs text-slate-500 mt-0.5">{data.total} total · sorted by most recent</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Subscribed at</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="inline-flex flex-col items-center gap-2">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">No subscribers yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-400">#{s.id}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{s.source}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteButton basePath="/newsletter" id={s.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: "emerald" | "blue" | "amber" | "slate" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    amber: "from-amber-50/60 ring-amber-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`relative bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
