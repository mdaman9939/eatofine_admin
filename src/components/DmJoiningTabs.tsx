"use client";

import { useState } from "react";
import { ApproveRejectButtons } from "./ApproveRejectButtons";
import { DeliveryManViewButton } from "./DeliveryManViewButton";
import { TablePager } from "./TablePager";

export interface PendingDm {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  zone_id: number | null;
  vehicle_id: number | null;
  submitted_at: string | null;
  status: string;
}

export interface DeniedDm {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  zone_id: number | null;
  vehicle_id: number | null;
  job_type: string | null;
  reason: string | null;
  denied_at: string | null;
  status: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(d) || d < 0) return "—";
  return d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export function DmJoiningTabs({ pending, denied }: { pending: PendingDm[]; denied: DeniedDm[] }) {
  const [tab, setTab] = useState<"pending" | "denied">("pending");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const rows = tab === "pending" ? pending : denied;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="px-6 pt-4 border-b border-slate-100 flex gap-1">
        <TabButton active={tab === "pending"} onClick={() => { setTab("pending"); setPage(1); }} label="Pending Delivery Man" count={pending.length} accent="amber" />
        <TabButton active={tab === "denied"} onClick={() => { setTab("denied"); setPage(1); }} label="Denied Deliveryman" count={denied.length} accent="rose" />
      </div>

      {tab === "pending" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Zone / Vehicle</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.length === 0 ? (
                <EmptyRow cols={6} title="No pending applications" hint="All riders are processed." />
              ) : pending.slice(pageStart, pageStart + pageSize).map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 align-top">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>{r.email ?? "—"}</div>
                    <div className="text-slate-400">{r.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>Zone #{r.zone_id ?? "—"}</div>
                    <div className="text-slate-400">Vehicle #{r.vehicle_id ?? "—"}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>{fmtDate(r.submitted_at)}</div>
                    <div className="text-slate-400">{daysSince(r.submitted_at)}</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                      <DeliveryManViewButton id={r.id} />
                      <ApproveRejectButtons basePath="delivery-men" id={r.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Job Type</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Availability Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {denied.length === 0 ? (
                <EmptyRow cols={8} title="No denied delivery men" hint="Rejected applications will appear here." />
              ) : denied.slice(pageStart, pageStart + pageSize).map((r) => (
                <tr key={r.id} className="hover:bg-rose-50/30 align-top">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    <div>{r.email ?? "—"}</div>
                    <div className="text-slate-400">{r.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-xs">Zone #{r.zone_id ?? "—"}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs capitalize">{r.job_type ?? "—"}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs">Vehicle #{r.vehicle_id ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Denied
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex justify-end">
                      <DeliveryManViewButton id={r.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePager page={safePage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPage={setPage} />
    </div>
  );
}

function TabButton({ active, onClick, label, count, accent }: { active: boolean; onClick: () => void; label: string; count: number; accent: "amber" | "rose" }) {
  const badge = accent === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return (
    <button
      onClick={onClick}
      className={`relative -mb-px px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
        active ? "text-slate-900 bg-white border border-slate-200 border-b-white" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
      <span className={`ml-2 text-[11px] font-mono px-1.5 py-0.5 rounded ${badge}`}>{count}</span>
    </button>
  );
}

function EmptyRow({ cols, title, hint }: { cols: number; title: string; hint: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-12 text-center text-slate-400">
        <div className="inline-flex flex-col items-center gap-2">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs">{hint}</p>
        </div>
      </td>
    </tr>
  );
}
