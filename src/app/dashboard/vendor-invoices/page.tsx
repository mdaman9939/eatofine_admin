import { adminFetch } from "../../../lib/api";
import { ActionButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";
import { GenerateInvoicesButton } from "../../../components/GenerateInvoicesButton";

interface VendorInvoice {
  id: number;
  invoice_number: string;
  vendor_id: number;
  vendor_name: string | null;
  restaurant_id: number;
  restaurant_name: string | null;
  plan_type: "commission" | "ppo" | "subscription";
  period_start: string | null;
  period_end: string | null;
  gross_sales: number;
  order_count: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  total_amount: number;
  tds_amount: number;
  net_payable: number;
  status: "draft" | "issued" | "paid" | "cancelled";
  notes: string | null;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string | null;
}

interface InvoiceStats {
  draft: number;
  issued: number;
  paid: number;
  cancelled: number;
  total_count: number;
  total_value: number;
  paid_value: number;
  outstanding_value: number;
}

function money(n: number | null | undefined): string {
  const v = typeof n === "number" && isFinite(n) ? n : 0;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const PLAN_TONE: Record<string, string> = {
  commission: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ppo:        "bg-teal-50 text-teal-700 ring-teal-200",
  subscription: "bg-amber-50 text-amber-700 ring-amber-200",
};

const PLAN_LABEL: Record<string, string> = {
  commission: "Commission",
  ppo: "PPO",
  subscription: "Subscription",
};

const STATUS_PILL: Record<string, { tone: string; dot: string; label: string }> = {
  draft:     { tone: "bg-slate-100 text-slate-700 border-slate-200",      dot: "bg-slate-400", label: "Draft" },
  issued:    { tone: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]", label: "Issued" },
  paid:      { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]", label: "Paid" },
  cancelled: { tone: "bg-slate-100 text-slate-500 border-slate-200",      dot: "bg-slate-400", label: "Cancelled" },
};

export default async function VendorInvoicesPage() {
  const [invoices, stats] = await Promise.all([
    adminFetch<VendorInvoice[]>("/admin/vendor-invoices"),
    adminFetch<InvoiceStats>("/admin/vendor-invoices/stats"),
  ]);

  const moneySlices = [
    { label: "Paid", value: Math.max(0, stats.paid_value || 0), color: DONUT_PALETTE.emerald },
    { label: "Outstanding", value: Math.max(0, stats.outstanding_value || 0), color: DONUT_PALETTE.amber },
  ];
  const moneyTotal = moneySlices.reduce((a, s) => a + s.value, 0);

  const headerRow = (
    <tr>
      <th className="px-4 py-3 font-semibold w-14">#</th>
      <th className="px-4 py-3 font-semibold">Invoice number</th>
      <th className="px-4 py-3 font-semibold">Vendor</th>
      <th className="px-4 py-3 font-semibold">Period</th>
      <th className="px-4 py-3 font-semibold">Plan</th>
      <th className="px-4 py-3 font-semibold text-right">Orders / Gross</th>
      <th className="px-4 py-3 font-semibold text-right">GST</th>
      <th className="px-4 py-3 font-semibold text-right">Total</th>
      <th className="px-4 py-3 font-semibold text-right">TDS</th>
      <th className="px-4 py-3 font-semibold text-right">Net payable</th>
      <th className="px-4 py-3 font-semibold">Status</th>
      <th className="px-4 py-3 font-semibold text-right">Actions</th>
    </tr>
  );

  const bodyRows = invoices.map((r) => {
    const gstTotal = (r.cgst || 0) + (r.sgst || 0);
    const planTone = PLAN_TONE[r.plan_type] ?? "bg-slate-100 text-slate-700 ring-slate-200";
    const planLabel = PLAN_LABEL[r.plan_type] ?? r.plan_type;
    const statusCfg = STATUS_PILL[r.status] ?? { tone: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", label: r.status };
    return (
      <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors align-top">
        <td className="px-4 py-4 font-mono text-xs text-slate-400 w-14">#{r.id}</td>
        <td className="px-4 py-4 font-mono text-[13px] text-slate-800 font-semibold">
          <a href={`/dashboard/vendor-invoices/${r.id}`} className="text-emerald-700 hover:underline">
            {r.invoice_number}
          </a>
        </td>
        <td className="px-4 py-4">
          <div className="font-semibold text-slate-900 truncate max-w-[16rem]">
            {r.vendor_name?.trim() || `Vendor #${r.vendor_id}`}
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-[16rem]">
            {r.restaurant_name?.trim() || `Restaurant #${r.restaurant_id}`}
          </div>
        </td>
        <td className="px-4 py-4 text-xs text-slate-600">
          <div className="tabular-nums">{fmtDate(r.period_start)}</div>
          <div className="text-[10px] text-slate-400">to {fmtDate(r.period_end)}</div>
        </td>
        <td className="px-4 py-4">
          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ring-1 ${planTone}`}>
            {planLabel}
          </span>
        </td>
        <td className="px-4 py-4 text-right tabular-nums">
          <div className="font-semibold text-slate-900">{r.order_count.toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-slate-500">{money(r.gross_sales)}</div>
        </td>
        <td className="px-4 py-4 text-right tabular-nums text-slate-700">
          <div>{money(gstTotal)}</div>
          <div className="text-[10px] text-slate-400">CGST {money(r.cgst)} · SGST {money(r.sgst)}</div>
        </td>
        <td className="px-4 py-4 text-right tabular-nums font-bold text-slate-900">{money(r.total_amount)}</td>
        <td className="px-4 py-4 text-right tabular-nums text-slate-700">{money(r.tds_amount)}</td>
        <td className="px-4 py-4 text-right tabular-nums font-semibold text-emerald-700">{money(r.net_payable)}</td>
        <td className="px-4 py-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.tone}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          {r.status === "issued" ? (
            <span className="inline-flex flex-wrap gap-1.5 justify-end">
              <ActionButton
                path={`/vendor-invoices/${r.id}/paid`}
                method="PATCH"
                label="Mark paid"
                variant="primary"
              />
              <ActionButton
                path={`/vendor-invoices/${r.id}/cancel`}
                method="PATCH"
                body={{ notes: "Cancelled by admin" }}
                label="Cancel"
                variant="subtle"
                confirm="Cancel this invoice? This cannot be undone."
              />
            </span>
          ) : (
            <span className="text-[11px] text-slate-300">—</span>
          )}
        </td>
      </tr>
    );
  });

  const searchTexts = invoices.map((r) =>
    [
      r.invoice_number,
      r.vendor_name ?? "",
      r.restaurant_name ?? "",
      r.plan_type,
      r.status,
      `#${r.id}`,
    ].join(" ").toLowerCase()
  );

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
              Billing · GST invoices
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Vendor invoices</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Review the monthly billing invoices raised to each restaurant for fees and commission — open one, mark it paid, or cancel it.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3 text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total billed</div>
              <div className="text-lg font-bold tabular-nums">{money(stats.total_value)}</div>
              <div className="text-[11px] text-white/70">{stats.total_count.toLocaleString("en-IN")} invoice{stats.total_count === 1 ? "" : "s"}</div>
            </div>
            <GenerateInvoicesButton />
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total invoices"
          value={stats.total_count.toLocaleString("en-IN")}
          suffix={money(stats.total_value)}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Issued"
          value={stats.issued.toLocaleString("en-IN")}
          suffix={`${money(stats.outstanding_value)} outstanding`}
          accent="amber"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Paid"
          value={stats.paid.toLocaleString("en-IN")}
          suffix={`${money(stats.paid_value)} collected`}
          accent="emerald2"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled.toLocaleString("en-IN")}
          suffix={stats.draft > 0 ? `${stats.draft} draft${stats.draft === 1 ? "" : "s"}` : "voided invoices"}
          accent="slate"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Donut + Table side-by-side ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Money split</h3>
          <p className="text-xs text-slate-500 mt-0.5">Collected vs still owed across all issued invoices.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart
              slices={moneySlices}
              centerLabel="Billed"
              centerValue={moneyTotal > 0 ? `₹${Math.round(moneyTotal).toLocaleString("en-IN")}` : "₹0"}
            />
          </div>
          <div className="mt-5">
            <DonutLegend slices={moneySlices} />
          </div>
        </div>

        <PaginatedTable
          headerRow={headerRow}
          bodyRows={bodyRows}
          searchTexts={searchTexts}
          pageSize={10}
          searchable
          colCount={12}
        />
      </div>
    </div>
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
  value: string;
  suffix?: string;
  accent: "amber" | "emerald" | "emerald2" | "slate";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    amber:    { tile: "bg-amber-100",    ring: "ring-amber-200",    text: "text-amber-700",    bg: "from-amber-50/60 to-white" },
    emerald:  { tile: "bg-emerald-100",  ring: "ring-emerald-200",  text: "text-emerald-700",  bg: "from-emerald-50/60 to-white" },
    emerald2: { tile: "bg-teal-100",     ring: "ring-teal-200",     text: "text-teal-700",     bg: "from-teal-50/60 to-white" },
    slate:    { tile: "bg-slate-100",    ring: "ring-slate-200",    text: "text-slate-600",    bg: "from-slate-50/60 to-white" },
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
