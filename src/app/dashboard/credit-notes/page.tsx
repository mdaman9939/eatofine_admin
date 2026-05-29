import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { CreateForm } from "../../../components/CreateForm";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface CreditNote {
  id: number;
  credit_note_number: string;
  order_id: number;
  customer_id: number | null;
  customer_name: string | null;
  restaurant_id: number | null;
  restaurant_name: string | null;
  reason: string | null;
  refund_amount: number;
  tax_reversed: number;
  delivery_reversed: number;
  total_credit: number;
  status: "issued" | "adjusted" | "cancelled" | string;
  notes: string | null;
  issued_by: string | null;
  created_at: string | null;
}

interface CreditNoteStats {
  issued: number;
  adjusted: number;
  cancelled: number;
  total_count: number;
  total_value: number;
}

const STATUS_PILL: Record<string, { tone: string; dot: string; label: string }> = {
  issued:    { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]", label: "Issued" },
  adjusted:  { tone: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]",    label: "Adjusted" },
  cancelled: { tone: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",     label: "Cancelled" },
};

function money(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default async function CreditNotesPage() {
  const [notes, stats] = await Promise.all([
    adminFetch<CreditNote[]>("/admin/credit-notes"),
    adminFetch<CreditNoteStats>("/admin/credit-notes/stats"),
  ]);

  const sorted = [...notes].sort((a, b) => b.id - a.id);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Refunds · Digital credit notes
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Credit notes</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Auto-issued for every refund. Each credit note reverses the original tax + delivery
              components so GST reconciles correctly.
            </p>
          </div>
          <CreateForm
            path="/credit-notes"
            title="Issue credit note"
            submitLabel="Issue"
            fields={[
              { name: "order_id",          label: "Order ID",          type: "number",   required: true },
              { name: "refund_amount",     label: "Refund amount (₹)", type: "number",   required: true },
              { name: "tax_reversed",      label: "Tax reversed (₹)",  type: "number" },
              { name: "delivery_reversed", label: "Delivery reversed (₹)", type: "number" },
              { name: "reason",            label: "Reason",            type: "text",     placeholder: "e.g. 'Wrong item delivered'" },
              { name: "notes",             label: "Notes",             type: "textarea" },
            ]}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total credit notes"
          value={stats.total_count.toLocaleString("en-IN")}
          suffix={`${stats.issued + stats.adjusted} active · ${stats.cancelled} cancelled`}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total credit value"
          value={money(stats.total_value)}
          suffix="sum across all credit notes"
          accent="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Issued"
          value={stats.issued.toLocaleString("en-IN")}
          suffix="awaiting adjustment"
          accent="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled.toLocaleString("en-IN")}
          suffix="reversed / voided"
          accent="rose"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Credit-notes table ─────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All credit notes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every refund auto-creates a credit note here. Issue one manually using the form above.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        </div>

        <PaginatedTable
          headerRow={
            <tr>
              <th className="w-16 px-6 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">CN number</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Restaurant</th>
              <th className="px-4 py-3 font-semibold text-right">Refund + tax + delivery</th>
              <th className="px-4 py-3 font-semibold text-right">Total credit</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Issued</th>
            </tr>
          }
          bodyRows={sorted.map((n) => (
            <tr key={n.id} className="hover:bg-emerald-50/40 transition-colors align-top">
              <td className="w-16 px-6 py-4 font-mono text-xs text-slate-400">#{n.id}</td>
              <td className="px-4 py-4">
                <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 ring-1 ring-slate-200 px-2 py-0.5 rounded">
                  {n.credit_note_number}
                </span>
              </td>
              <td className="px-4 py-4">
                <Link
                  href={`/dashboard/orders/${n.order_id}`}
                  className="inline-flex items-center font-mono text-sm text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                >
                  #{n.order_id}
                </Link>
              </td>
              <td className="px-4 py-4">
                {n.customer_name ? (
                  <span className="text-slate-800 text-sm font-medium">{n.customer_name}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
                {n.customer_id != null && (
                  <div className="text-[10px] font-mono text-slate-400">#{n.customer_id}</div>
                )}
              </td>
              <td className="px-4 py-4">
                {n.restaurant_name ? (
                  <span className="text-slate-700 text-sm">{n.restaurant_name}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
                {n.restaurant_id != null && (
                  <div className="text-[10px] font-mono text-slate-400">#{n.restaurant_id}</div>
                )}
              </td>
              <td className="px-4 py-4 text-right tabular-nums">
                <div className="text-sm text-slate-800 font-semibold">{money(n.refund_amount)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  tax {money(n.tax_reversed)} · delivery {money(n.delivery_reversed)}
                </div>
              </td>
              <td className="px-4 py-4 text-right tabular-nums font-bold text-emerald-700">
                {money(n.total_credit)}
              </td>
              <td className="px-4 py-4 text-sm text-slate-700 max-w-[14rem]">
                {n.reason ? (
                  <span className="line-clamp-2" title={n.reason}>{n.reason}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-4">
                <StatusPill status={n.status} />
              </td>
              <td className="px-4 py-4 text-xs text-slate-500">
                {n.created_at ? (
                  <div>
                    <div>{new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    {n.issued_by && (
                      <div className="text-[10px] text-slate-400 mt-0.5">by {n.issued_by}</div>
                    )}
                  </div>
                ) : "—"}
              </td>
            </tr>
          ))}
          searchTexts={sorted.map((n) =>
            `${n.credit_note_number} ${n.order_id} ${n.customer_name ?? ""} ${n.restaurant_name ?? ""} ${n.reason ?? ""} ${n.status}`.toLowerCase()
          )}
          pageSize={10}
          searchable
          colCount={10}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[status] ?? {
    tone: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent: "emerald" | "teal" | "blue" | "rose";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal:    { tile: "bg-teal-100",    ring: "ring-teal-200",    text: "text-teal-700",    bg: "from-teal-50/60 to-white" },
    blue:    { tile: "bg-blue-100",    ring: "ring-blue-200",    text: "text-blue-700",    bg: "from-blue-50/60 to-white" },
    rose:    { tile: "bg-rose-100",    ring: "ring-rose-200",    text: "text-rose-700",    bg: "from-rose-50/60 to-white" },
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
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
