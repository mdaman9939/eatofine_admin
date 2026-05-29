import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface User {
  id: number;
  f_name: string | null;
  l_name: string | null;
  email: string | null;
  phone: string | null;
  status: boolean | null;
  created_at: string | null;
}

interface UsersResponse {
  total: number;
  users: User[];
}

function initials(f: string | null, l: string | null) {
  const a = (f?.[0] ?? "").toUpperCase();
  const b = (l?.[0] ?? "").toUpperCase();
  return (a + b) || "U";
}

export default async function UsersPage() {
  const data = await adminFetch<UsersResponse>("/admin/users?limit=500");
  const users = data.users;
  const activeCount = users.filter((u) => u.status).length;
  const blockedCount = users.length - activeCount;
  const now = Date.now();
  const newThisMonth = users.filter((u) => {
    if (!u.created_at) return false;
    return now - new Date(u.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const slices = [
    { label: "Active", value: activeCount, color: DONUT_PALETTE.emerald },
    { label: "Blocked", value: blockedCount, color: DONUT_PALETTE.rose },
  ];

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
              People · End customers
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Customers</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Everyone who has signed up to order from the platform. Blocking a customer prevents them
              from placing new orders while keeping their order history intact.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Registered</div>
            <div className="text-lg font-bold tabular-nums">{data.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{activeCount} active · {blockedCount} blocked</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total customers" value={data.total} suffix={`Showing ${users.length}`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        } />
        <StatCard label="Active" value={activeCount} suffix={users.length > 0 ? `${Math.round((activeCount / users.length) * 100)}% of fetched` : "—"} accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <StatCard label="New this month" value={newThisMonth} suffix="Last 30 days" accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        } />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Customer status</h3>
          <p className="text-xs text-slate-500 mt-0.5">Active vs blocked split.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Customers" centerValue={users.length} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>
        </div>

        <PaginatedTable
          headerRow={
            <tr>
              <th className="w-16 px-6 py-3 font-semibold">#</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Phone</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          }
          bodyRows={users.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="w-16 px-6 py-3">
                <span className="font-mono text-xs text-slate-400">#{r.id}</span>
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm text-[11px] font-bold">
                    {initials(r.f_name, r.l_name)}
                  </span>
                  <div className="min-w-0">
                    <Link href={`/dashboard/users/${r.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors truncate block">
                      {`${r.f_name ?? ""} ${r.l_name ?? ""}`.trim() || "—"}
                    </Link>
                    <div className="text-[11px] text-slate-500 truncate">{r.email ?? "—"}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3">
                <span className="text-slate-700 font-mono text-xs">{r.phone ?? "—"}</span>
              </td>
              <td className="px-6 py-3">
                {r.status ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                    Blocked
                  </span>
                )}
              </td>
              <td className="px-6 py-3">
                <span className="text-xs text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
              </td>
              <td className="px-6 py-3 text-right">
                <ToggleStatusButton basePath="/users" id={r.id} currentStatus={!!r.status} />
              </td>
            </tr>
          ))}
          searchTexts={users.map((r) =>
            `${r.f_name ?? ""} ${r.l_name ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase()
          )}
          pageSize={10}
          searchable
          colCount={6}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, accent, icon }: { label: string; value: number; suffix?: string; accent: "emerald" | "teal"; icon: React.ReactNode }) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
        <span className={`w-10 h-10 rounded-xl ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value.toLocaleString("en-IN")}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
