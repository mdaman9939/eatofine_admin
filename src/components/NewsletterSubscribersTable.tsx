"use client";

import { useMemo, useState } from "react";
import { DeleteButton } from "./ActionButton";

export interface Subscriber {
  id: number;
  email: string;
  source: string;
  status: string;
  created_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

type Sort = "newest" | "oldest" | "email";

/**
 * Subscribed-email list with search + sort + source/status filter (StackFood's
 * "Subscribed Mail List" filters). Operates client-side on the loaded rows.
 */
export function NewsletterSubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");

  const sources = useMemo(() => Array.from(new Set(subscribers.map((s) => s.source).filter(Boolean))), [subscribers]);
  const statuses = useMemo(() => Array.from(new Set(subscribers.map((s) => s.status).filter(Boolean))), [subscribers]);

  const rows = useMemo(() => {
    let r = subscribers;
    if (search.trim()) r = r.filter((s) => s.email.toLowerCase().includes(search.trim().toLowerCase()));
    if (source) r = r.filter((s) => s.source === source);
    if (status) r = r.filter((s) => s.status === status);
    r = [...r].sort((a, b) => {
      if (sort === "email") return a.email.localeCompare(b.email);
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sort === "oldest" ? ta - tb : tb - ta;
    });
    return r;
  }, [subscribers, search, sort, source, status]);

  const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by email…"
          className={`${inputCls} flex-1 min-w-[200px]`}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={inputCls}>
          <option value="newest">Sort: Newest first</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="email">Sort: Email A–Z</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
          <option value="">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-500 font-mono ml-auto">{rows.length} shown</span>
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
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No subscribers match the filter.</td></tr>
            ) : rows.map((s) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
