import { adminFetch } from "../../../lib/api";
import { NewsletterSubscribersTable, type Subscriber } from "../../../components/NewsletterSubscribersTable";

export default async function NewsletterPage() {
  const data = await adminFetch<{ total: number; items: Subscriber[] }>("/admin/newsletter?limit=200");
  const subscribers = data.items;
  // Server component runs per request, so `now` is stable for this render.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const recent30d = subscribers.filter((s) => {
    if (!s.created_at) return false;
    return now - new Date(s.created_at).getTime() < 30 * 86_400_000;
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

      {/* Searchable / filterable subscriber list */}
      <NewsletterSubscribersTable subscribers={subscribers} />
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
