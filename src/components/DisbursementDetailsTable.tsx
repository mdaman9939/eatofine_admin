"use client";

import { useMemo, useState } from "react";

export interface DisbRow {
  id: number;
  recipient: string | null;
  type: string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string | null;
  disbursement_id?: string | null;
  zone_id?: number | null;
  zone_name?: string | null;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

const COMPLETED = new Set(["disbursed", "completed"]);
const CANCELED = new Set(["canceled", "cancelled"]);
const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
type Period = "all" | "7d" | "30d" | "90d" | "1y";

function StatCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "rose" | "blue" | "slate" }) {
  const map = { emerald: "text-emerald-600", amber: "text-amber-600", rose: "text-rose-600", blue: "text-blue-600", slate: "text-slate-700" } as const;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
      <div className={`text-2xl font-bold tabular-nums ${map[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function DisbursementDetailsTable({ restaurant, deliveryman }: { restaurant: DisbRow[]; deliveryman: DisbRow[] }) {
  const [tab, setTab] = useState<"restaurant" | "deliveryman">("restaurant");
  const [period, setPeriod] = useState<Period>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [zone, setZone] = useState("");          // selected zone_id (as string)
  const [recipient, setRecipient] = useState(""); // selected restaurant / delivery-man name
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const all = tab === "restaurant" ? restaurant : deliveryman;

  // Dropdown options derived from the active tab's data (so every option has rows).
  const zoneOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of all) if (r.zone_id != null) m.set(String(r.zone_id), r.zone_name ?? `Zone ${r.zone_id}`);
    return Array.from(m, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);
  const recipientOptions = useMemo(
    () => Array.from(new Set(all.map((r) => r.recipient).filter((x): x is string => !!x))).sort(),
    [all],
  );
  const statuses = useMemo(() => Array.from(new Set(all.map((r) => r.status))), [all]);

  // Date window: a Period preset and an explicit From/To range are mutually
  // exclusive (picking one clears the other), so only one drives the window.
  const [fromMs, toMs] = useMemo<[number | null, number | null]>(() => {
    if (period !== "all") return [Date.now() - PERIOD_DAYS[period] * 86_400_000, null];
    const f = fromDate ? new Date(fromDate).getTime() : null;
    const t = toDate ? new Date(toDate + "T23:59:59.999").getTime() : null;
    return [f, t];
  }, [period, fromDate, toDate]);

  const inWindow = (iso: string | null) => {
    if (fromMs == null && toMs == null) return true;
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    if (fromMs != null && t < fromMs) return false;
    if (toMs != null && t > toMs) return false;
    return true;
  };

  // base = rows after the main filter bar (period/date/zone/recipient).
  // Drives BOTH the analysis cards and the report table.
  const base = useMemo(
    () => all.filter((r) =>
      inWindow(r.created_at) &&
      (!zone || String(r.zone_id ?? "") === zone) &&
      (!recipient || r.recipient === recipient),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, fromMs, toMs, zone, recipient],
  );

  // Analysis (5 cards) — reflects the filters + selected type.
  const sumWhere = (pred: (r: DisbRow) => boolean) => base.filter(pred).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalAmt = base.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const disbursedAmt = sumWhere((r) => COMPLETED.has(r.status));
  const pendingAmt = sumWhere((r) => r.status === "pending");
  const inProcessAmt = sumWhere((r) => r.status === "processing");

  // Table = base + status + free-text search (table-level refinements).
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return base.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q || String(r.id).includes(q) || (r.disbursement_id ?? "").toLowerCase().includes(q) || (r.recipient ?? "").toLowerCase().includes(q)),
    );
  }, [base, search, status]);

  const csv = useMemo(() => {
    const head = "sl,id,recipient,zone,created_at,amount,payment_method,status";
    const body = rows.map((r, i) =>
      [i + 1, r.disbursement_id ?? r.id, r.recipient ?? "", r.zone_name ?? "", r.created_at ?? "", r.amount, r.payment_method ?? "cash", r.status]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [head, ...body].join("\n");
  }, [rows]);

  // Mutual-exclusivity handlers for the date controls.
  const pickPeriod = (p: Period) => { setPeriod(p); setFromDate(""); setToDate(""); };
  const onFrom = (v: string) => { setFromDate(v); setPeriod("all"); };
  const onTo = (v: string) => { setToDate(v); setPeriod("all"); };
  const resetFilters = () => { setPeriod("all"); setFromDate(""); setToDate(""); setZone(""); setRecipient(""); setStatus(""); setSearch(""); };
  const hasFilters = period !== "all" || !!fromDate || !!toDate || !!zone || !!recipient || !!status || !!search;

  const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";
  const fieldLabel = "block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1";
  const infoLabel = tab === "restaurant" ? "Restaurant Info" : "Delivery Man Info";

  return (
    <div className="space-y-6">
      {/* Recent Transactions — type toggle */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Recent Transactions</h2>
        <div className="flex gap-2">
          {(["restaurant", "deliveryman"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); resetFilters(); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              {t === "restaurant" ? "Restaurant Disbursement" : "Delivery Man Disbursement"}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar — Period / From / To / Zone / Restaurant|Delivery man */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div>
          <span className={fieldLabel}>Period</span>
          <div className="flex gap-1">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                onClick={() => pickPeriod(period === p ? "all" : p)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${period === p ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={fieldLabel}>From Date</label>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => onFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={fieldLabel}>To Date</label>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => onTo(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={fieldLabel}>Zone</label>
          <select value={zone} onChange={(e) => setZone(e.target.value)} className={inputCls}>
            <option value="">All Zones</option>
            {zoneOptions.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>{tab === "restaurant" ? "Restaurant" : "Delivery Man"}</label>
          <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className={`${inputCls} max-w-[220px]`}>
            <option value="">{tab === "restaurant" ? "All Restaurants" : "All Delivery Men"}</option>
            {recipientOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {hasFilters && (
          <button onClick={resetFilters} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">
            Reset
          </button>
        )}
      </div>

      {/* Analysis — 5 cards, reflecting filters + selected type */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Number of disbursement" value={base.length.toString()} tone="blue" />
        <StatCard label="Total Amount" value={inr(totalAmt)} tone="slate" />
        <StatCard label="Disbursed Amount" value={inr(disbursedAmt)} tone="emerald" />
        <StatCard label="Pending amount" value={inr(pendingAmt)} tone="rose" />
        <StatCard label="In process amount" value={inr(inProcessAmt)} tone="amber" />
      </div>

      {/* List card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Total Disbursements <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{rows.length}</span>
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="">All status</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by id / name…" className={`${inputCls} min-w-[200px]`} />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`disbursements-${tab}.csv`} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SI</th>
                <th className="px-4 py-3 font-semibold">Id</th>
                <th className="px-4 py-3 font-semibold">{infoLabel}</th>
                <th className="px-4 py-3 font-semibold">Created At</th>
                <th className="px-4 py-3 font-semibold text-right">Disburse Amount</th>
                <th className="px-4 py-3 font-semibold">Payment Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">No disbursements found.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.disbursement_id ?? `#${r.id}`}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{r.recipient ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.amount)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs capitalize">{(r.payment_method ?? "cash").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${COMPLETED.has(r.status) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : CANCELED.has(r.status) ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {r.status}
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
