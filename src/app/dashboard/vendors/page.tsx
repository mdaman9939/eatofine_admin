import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface Vendor {
  id: number;
  f_name: string | null;
  l_name: string | null;
  email: string | null;
  phone: string | null;
  status: boolean | null;
  image: string | null;
  created_at: string | null;
}

interface VendorsResponse {
  total: number;
  vendors: Vendor[];
}

function initials(f: string | null, l: string | null) {
  const a = (f?.[0] ?? "").toUpperCase();
  const b = (l?.[0] ?? "").toUpperCase();
  return (a + b) || "V";
}

export default async function VendorsPage() {
  const data = await adminFetch<VendorsResponse>("/admin/vendors?limit=500");
  const vendors = data.vendors;
  const activeCount = vendors.filter((v) => v.status).length;
  const inactiveCount = vendors.length - activeCount;

  const now = Date.now();
  const newThisMonth = vendors.filter((v) => {
    if (!v.created_at) return false;
    return now - new Date(v.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const slices = [
    { label: "Active", value: activeCount, color: DONUT_PALETTE.emerald },
    { label: "Inactive", value: inactiveCount, color: DONUT_PALETTE.slate },
  ];

  const headerRow = (
    <tr>
      <th className="px-4 py-3 font-semibold w-16">#</th>
      <th className="px-4 py-3 font-semibold">Vendor</th>
      <th className="px-4 py-3 font-semibold">Phone</th>
      <th className="px-4 py-3 font-semibold">Status</th>
      <th className="px-4 py-3 font-semibold">Joined</th>
      <th className="px-4 py-3 font-semibold text-right">Actions</th>
    </tr>
  );

  const bodyRows = vendors.map((r) => (
    <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-slate-400 w-16">#{r.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm text-[11px] font-bold">
            {initials(r.f_name, r.l_name)}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">
              {`${r.f_name ?? ""} ${r.l_name ?? ""}`.trim() || "—"}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{r.email ?? "—"}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700 font-mono text-xs">{r.phone ?? "—"}</td>
      <td className="px-4 py-3">
        {r.status ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Disabled
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
      <td className="px-4 py-3 text-right">
        <ToggleStatusButton basePath="/vendors" id={r.id} currentStatus={!!r.status} />
      </td>
    </tr>
  ));

  const searchTexts = vendors.map((r) =>
    `${r.f_name ?? ""} ${r.l_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase()
  );

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
              Restaurant management · Owners
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Vendors</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Restaurant owners and their account access. Each vendor controls one or more restaurants
              on the platform. Disabling a vendor blocks them from the merchant app and dashboard.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">On platform</div>
            <div className="text-lg font-bold tabular-nums">{data.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{activeCount} active · {inactiveCount} disabled</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-b from-emerald-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total vendors</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-100 ring-1 ring-emerald-200 text-emerald-700 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{data.total}</div>
          <div className="mt-0.5 text-xs text-slate-500">Showing {vendors.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-b from-teal-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Active</span>
            <span className="w-10 h-10 rounded-xl bg-teal-100 ring-1 ring-teal-200 text-teal-700 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{activeCount}</div>
          <div className="mt-0.5 text-xs text-slate-500">{vendors.length > 0 ? `${Math.round((activeCount / vendors.length) * 100)}% of fetched` : "—"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-b from-emerald-50/60 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">New this month</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-100 ring-1 ring-emerald-200 text-emerald-700 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{newThisMonth}</div>
          <div className="mt-0.5 text-xs text-slate-500">Last 30 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Active vs disabled</h3>
          <p className="text-xs text-slate-500 mt-0.5">Status split across all vendors.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Vendors" centerValue={vendors.length} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>
        </div>

        <PaginatedTable
          headerRow={headerRow}
          bodyRows={bodyRows}
          searchTexts={searchTexts}
          pageSize={10}
          searchable
          colCount={6}
        />
      </div>
    </div>
  );
}
