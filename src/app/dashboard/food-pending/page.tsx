import { adminFetch } from "../../../lib/api";
import { ApproveRejectButtons } from "../../../components/ApproveRejectButtons";
import { FoodViewButton } from "../../../components/FoodViewButton";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface PendingFood {
  id: number;
  name: string;
  price: number;
  veg: boolean;
  image_full_url: string | null;
  restaurant_id: number | null;
  restaurant_name: string | null;
  submitted_at: string | null;
  status: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default async function FoodPendingPage() {
  const data = await adminFetch<{ total: number; items: PendingFood[] }>("/admin/food/pending").catch(
    () => ({ total: 0, items: [] as PendingFood[] }),
  );
  const rows = data.items;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> FOOD MANAGEMENT · APPROVALS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">New Food Requests</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            New items restaurants added that need your review. View the details, then approve to make the item
            live or reject with a remark.
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
        <StatTile label="Restaurants" value={new Set(rows.map((r) => r.restaurant_id)).size.toString()} accent="rose" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Pending food items</h2>
        <p className="text-xs text-slate-500 mt-0.5">{rows.length} item(s) awaiting your decision.</p>
      </div>
      <PaginatedTable
        colCount={6}
        pageSize={10}
        searchable
        empty="No pending food requests"
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Item</th>
            <th className="px-4 py-3 font-semibold">Restaurant</th>
            <th className="px-4 py-3 font-semibold text-right">Price</th>
            <th className="px-4 py-3 font-semibold">Submitted</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        }
        searchTexts={rows.map((r) => `#${r.id} ${r.name} ${r.restaurant_name ?? ""} ${r.veg ? "veg" : "non-veg"}`.toLowerCase())}
        bodyRows={rows.map((r) => (
          <tr key={r.id} className="hover:bg-emerald-50/40 align-top">
            <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
            <td className="px-4 py-4">
              <div className="flex items-center gap-2.5">
                {r.image_full_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_full_url} alt={r.name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">🍽️</div>
                )}
                <div>
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-[11px] text-slate-400">{r.veg ? "Veg" : "Non-veg"}</div>
                </div>
              </div>
            </td>
            <td className="px-4 py-4 text-slate-700 text-xs">{r.restaurant_name ?? "—"}</td>
            <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">₹{r.price}</td>
            <td className="px-4 py-4 text-slate-600 text-xs">{fmtDate(r.submitted_at)}</td>
            <td className="px-4 py-4 text-right">
              <div className="inline-flex items-center gap-2">
                <FoodViewButton id={r.id} />
                <ApproveRejectButtons basePath="food" id={r.id} />
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
