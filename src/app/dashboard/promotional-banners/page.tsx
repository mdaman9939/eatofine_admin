import { adminFetch } from "../../../lib/api";
import { CreateForm } from "../../../components/CreateForm";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string | null;
  type: string;
  target: string | null;
  cta_text: string;
  status: boolean;
  zone_id: number | null;
  created_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default async function PromotionalBannersPage() {
  const data = await adminFetch<{ total: number; items: Banner[] }>("/admin/promotional-banners");
  const banners = data.items;
  const active = banners.filter((b) => b.status).length;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> PROMOTIONS · LARGE BANNERS
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Promotional Banners</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Full-width hero placements for seasonal campaigns. Bigger than the standard home-screen carousel — used for marquee promos.
            </p>
          </div>
          <CreateForm
            path="/promotional-banners"
            title="New banner"
            fields={[
              { name: "title", label: "Title", type: "text", required: true, placeholder: "🎉 Weekend feast — 30% off" },
              { name: "subtitle", label: "Subtitle", type: "text", placeholder: "Use code WEEKEND" },
              { name: "type", label: "Target type", type: "select", options: [
                { value: "coupon", label: "Coupon" },
                { value: "restaurant", label: "Restaurant" },
                { value: "banner", label: "Static banner" },
                { value: "food", label: "Food item" },
              ], defaultValue: "coupon" },
              { name: "target", label: "Target value", type: "text", placeholder: "WEEKEND or restaurant_id" },
              { name: "cta_text", label: "CTA button text", type: "text", defaultValue: "Order now" },
              { name: "image", label: "Image URL", type: "text", placeholder: "/storage/banner/promo.png" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total banners" value={banners.length.toString()} accent="emerald" />
        <StatTile label="Active" value={active.toString()} hint={`${banners.length - active} inactive`} accent="blue" />
        <StatTile label="By type" value={[...new Set(banners.map((b) => b.type))].length.toString()} accent="amber" />
        <StatTile label="With image" value={banners.filter((b) => !!b.image).length.toString()} accent="slate" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">All banners</h2>
          <p className="text-xs text-slate-500 mt-0.5">{banners.length} total.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">No banners yet. Click <strong>+ New banner</strong> to create one.</td></tr>
              ) : banners.map((b) => (
                <tr key={b.id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{b.title}</div>
                    {b.subtitle && <div className="text-xs text-slate-500 mt-0.5">{b.subtitle}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{b.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">{b.target ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(b.created_at)}</td>
                  <td className="px-4 py-3">
                    {b.status ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex gap-2">
                      <ToggleStatusButton basePath="/promotional-banners" id={b.id} currentStatus={b.status} />
                      <DeleteButton basePath="/promotional-banners" id={b.id} />
                    </span>
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

function StatTile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: "emerald" | "blue" | "amber" | "slate" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    amber: "from-amber-50/60 ring-amber-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
