import { adminFetch } from "../../../lib/api";
import { ActionButton, ToggleStatusButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface DM {
  id: number;
  f_name: string | null;
  l_name: string | null;
  email: string | null;
  phone: string | null;
  status: boolean | null;
  application_status: string | null;
  zone_id: number | null;
  created_at: string | null;
}

interface DeliveryMenResponse {
  total: number;
  delivery_men: DM[];
}

function initials(f: string | null, l: string | null) {
  return ((f?.[0] ?? "").toUpperCase() + (l?.[0] ?? "").toUpperCase()) || "D";
}

const APP_PALETTE: Record<string, string> = {
  approved: DONUT_PALETTE.emerald,
  pending: DONUT_PALETTE.amber,
  denied: DONUT_PALETTE.rose,
  unset: DONUT_PALETTE.slate,
};

const APP_CHIP: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  denied: "bg-rose-50 text-rose-700 border-rose-200",
  unset: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function DeliveryMenPage() {
  const data = await adminFetch<DeliveryMenResponse>("/admin/delivery-men?limit=500");
  const men = data.delivery_men;
  const activeCount = men.filter((d) => d.status).length;
  const pendingCount = men.filter((d) => (d.application_status ?? "").toLowerCase() === "pending").length;
  const approvedCount = men.filter((d) => (d.application_status ?? "").toLowerCase() === "approved").length;
  const deniedCount = men.filter((d) => (d.application_status ?? "").toLowerCase() === "denied").length;
  const unsetCount = men.length - approvedCount - pendingCount - deniedCount;

  const slices = [
    { label: "Approved", value: approvedCount, color: APP_PALETTE.approved },
    { label: "Pending", value: pendingCount, color: APP_PALETTE.pending },
    { label: "Denied", value: deniedCount, color: APP_PALETTE.denied },
    { label: "Unset", value: unsetCount, color: APP_PALETTE.unset },
  ].filter((s) => s.value > 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Logistics · Field force
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery men</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Riders who fulfil orders for the platform. Applications must be approved before a rider can
              go online; disabling deactivates their account without rejecting the application.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">On platform</div>
            <div className="text-lg font-bold tabular-nums">{data.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{approvedCount} approved · {pendingCount} pending</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total riders" value={data.total} suffix={`Showing ${men.length}`} accent="emerald" />
        <StatCard label="Approved" value={approvedCount} suffix={men.length > 0 ? `${Math.round((approvedCount / men.length) * 100)}% of fetched` : "—"} accent="teal" />
        <StatCard label="Pending review" value={pendingCount} suffix={pendingCount > 0 ? "needs attention" : "all clear"} accent={pendingCount > 0 ? "amber" : "emerald"} />
        <StatCard label="Active" value={activeCount} suffix={`${men.length - activeCount} disabled`} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Application status</h3>
          <p className="text-xs text-slate-500 mt-0.5">Approval workflow split.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Riders" centerValue={men.length} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>
        </div>

        <PaginatedTable
          headerRow={
            <tr>
              <th className="px-6 py-3 font-semibold w-16">#</th>
              <th className="px-6 py-3 font-semibold">Rider</th>
              <th className="px-6 py-3 font-semibold">Phone</th>
              <th className="px-6 py-3 font-semibold">Zone</th>
              <th className="px-6 py-3 font-semibold">Application</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          }
          bodyRows={men.map((r) => {
            const appKey = (r.application_status ?? "unset").toLowerCase();
            return (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-3 w-16">
                  <span className="font-mono text-xs text-slate-400">#{r.id}</span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm text-[11px] font-bold">
                      {initials(r.f_name, r.l_name)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {`${r.f_name ?? ""} ${r.l_name ?? ""}`.trim() || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{r.email ?? ""}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className="text-slate-700 font-mono text-xs">{r.phone ?? "—"}</span>
                </td>
                <td className="px-6 py-3">
                  <span className="text-slate-700 text-xs">{r.zone_id !== null && r.zone_id !== undefined ? `Zone ${r.zone_id}` : "—"}</span>
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${APP_CHIP[appKey] ?? APP_CHIP.unset}`}>
                    {r.application_status ?? "—"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {r.status ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="inline-flex gap-1.5 flex-wrap justify-end">
                    <ToggleStatusButton basePath="/delivery-men" id={r.id} currentStatus={!!r.status} />
                    {(r.application_status ?? "").toLowerCase() !== "approved" && (
                      <ActionButton path={`/delivery-men/${r.id}/approval`} method="PATCH" body={{ approval: "approved" }} label="Approve" variant="primary" />
                    )}
                    {(r.application_status ?? "").toLowerCase() !== "denied" && (
                      <ActionButton path={`/delivery-men/${r.id}/approval`} method="PATCH" body={{ approval: "denied" }} label="Deny" variant="subtle" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          searchTexts={men.map((r) => `${r.f_name ?? ""} ${r.l_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""} ${r.application_status ?? ""}`.toLowerCase())}
          pageSize={10}
          searchable
          colCount={7}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: number | string; suffix?: string; accent: "emerald" | "teal" | "amber" }) {
  const palette: Record<string, { bg: string }> = {
    emerald: { bg: "from-emerald-50/60 to-white" },
    teal: { bg: "from-teal-50/60 to-white" },
    amber: { bg: "from-amber-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
