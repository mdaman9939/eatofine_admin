import Link from "next/link";
import { adminFetch } from "../../../lib/api";

interface InvoiceRow {
  invoice_no: string;
  order_id: number;
  issued_on: string | null;
  customer: { f_name: string | null; l_name: string | null; email: string | null } | null;
  restaurant: { name: string | null } | null;
  subtotal: number;
  tax: number;
  delivery_charge: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  payment_method: string | null;
  status: string;
}

export default async function InvoicesPage() {
  const data = await adminFetch<{ total: number; invoices: InvoiceRow[] }>("/admin/invoices?limit=100");
  const invoices = data.invoices;

  const totalRevenue = invoices.reduce((a, i) => a + i.total, 0);
  const totalTax = invoices.reduce((a, i) => a + i.tax, 0);
  const totalDelivery = invoices.reduce((a, i) => a + i.delivery_charge, 0);
  const avgInvoice = invoices.length ? totalRevenue / invoices.length : 0;

  // Group by restaurant for the breakdown widget.
  const restaurantMap = new Map<string, { name: string; count: number; total: number }>();
  for (const inv of invoices) {
    const name = inv.restaurant?.name ?? "—";
    const cur = restaurantMap.get(name) ?? { name, count: 0, total: 0 };
    cur.count += 1;
    cur.total += inv.total;
    restaurantMap.set(name, cur);
  }
  const topRestaurants = Array.from(restaurantMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const topMax = topRestaurants[0]?.total ?? 0;

  // This-month bucket.
  const now = new Date();
  const thisMonth = invoices.filter((i) => {
    if (!i.issued_on) return false;
    const d = new Date(i.issued_on);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Pie segment colors for the donut.
  const DONUT_COLORS = ["#10B981", "#06B6D4", "#14B8A6", "#22D3EE", "#34D399", "#5EEAD4"];

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
              BRD §5.2 · Enhancements
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Tax Invoices</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Auto-generated GST-compliant invoices for every delivered + paid order. Numbering
              follows <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded ring-1 ring-white/20">INV-YYYY-MM-NNNNN</code>.
              PDF generation + email cron is the next phase.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold">Status</div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white/95 ring-1 ring-white/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              Auto-generated
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total invoices" value={invoices.length} suffix={`${thisMonth.length} this month`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        } />
        <StatCard label="Gross revenue" value={`₹${formatINR(totalRevenue)}`} suffix={`avg ₹${avgInvoice.toFixed(0)} / invoice`} accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Tax collected" value={`₹${formatINR(totalTax)}`} suffix="CGST + SGST + IGST" accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h4m2 5l4-4M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2h-2" />
          </svg>
        } />
        <StatCard label="Delivery fees" value={`₹${formatINR(totalDelivery)}`} suffix="across all invoices" accent="cyan" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 17H3v-6l2-5h14l2 5v6h-2M5 17a2 2 0 104 0M5 17a2 2 0 014 0m6 0a2 2 0 104 0m-4 0a2 2 0 014 0" />
          </svg>
        } />
      </div>

      {/* ── Restaurant breakdown ───────────────────────────────── */}
      {topRestaurants.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Top restaurants by invoice revenue</h2>
                <p className="text-xs text-slate-500 mt-0.5">Where the invoiced volume is concentrated right now.</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut */}
            <div className="flex items-center gap-6">
              <Donut total={totalRevenue} segments={topRestaurants.map((r, i) => ({ value: r.total, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} />
              <div className="space-y-2 min-w-0">
                {topRestaurants.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2 text-sm min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-slate-700 truncate">{r.name}</span>
                    <span className="text-xs text-slate-400 font-mono ml-auto pl-2">
                      {totalRevenue > 0 ? Math.round((r.total / totalRevenue) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-restaurant horizontal bars */}
            <div className="space-y-3">
              {topRestaurants.map((r, i) => (
                <div key={r.name}>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="font-medium text-slate-800 truncate">{r.name}</span>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">
                      <span className="font-mono text-slate-700">₹{formatINR(r.total)}</span> · {r.count} {r.count === 1 ? "invoice" : "invoices"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${topMax > 0 ? (r.total / topMax) * 100 : 0}%`,
                        background: DONUT_COLORS[i % DONUT_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Invoices table ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any invoice number to open its detail view.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Invoice #</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                <th className="px-4 py-3 font-semibold text-right">CGST</th>
                <th className="px-4 py-3 font-semibold text-right">SGST</th>
                <th className="px-4 py-3 font-semibold text-right">Delivery</th>
                <th className="px-4 py-3 font-semibold text-right">Grand total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((i) => {
                const customerName = i.customer
                  ? `${i.customer.f_name ?? ""} ${i.customer.l_name ?? ""}`.trim() || i.customer.email || "—"
                  : "—";
                return (
                  <tr key={i.invoice_no} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/invoices/${i.order_id}`}
                        className="font-mono text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-semibold"
                      >
                        {i.invoice_no}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">#{i.order_id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {initials(customerName)}
                        </span>
                        <span className="text-slate-700 text-sm truncate">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{i.restaurant?.name ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-slate-700">₹{i.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-xs text-slate-500">₹{i.cgst.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-xs text-slate-500">₹{i.sgst.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-xs text-slate-500">₹{i.delivery_charge.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-bold text-slate-900">₹{i.total.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={i.status} />
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">No delivered+paid orders yet</p>
                      <p className="text-xs">Place a demo order and mark it delivered to generate the first invoice.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closing: lifecycle explainer ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              Invoice lifecycle
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">From order delivery to GSTN-ready invoice</h3>
            <p className="mt-1.5 text-sm text-white/75">
              The moment an order is marked delivered and payment is confirmed, an invoice row is
              created with auto-numbered <code className="text-xs bg-white/10 px-1 py-0.5 rounded ring-1 ring-white/15">INV-YYYY-MM-NNNNN</code>{" "}
              format. PDF rendering and customer email delivery run on background jobs (next phase).
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
              <LifecycleStep step="1" title="DRAFT" body="Order delivered, awaiting payment confirmation." />
              <LifecycleStep step="2" title="GENERATED" body="Auto-numbered, line items + GST split locked." active />
              <LifecycleStep step="3" title="SENT" body="PDF rendered + emailed to customer." />
              <LifecycleStep step="4" title="VIEWED" body="Customer opened the email or PDF link." />
              <LifecycleStep step="5" title="PAID" body="Final settlement reflected (auto for COD)." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatINR(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function LifecycleStep({ step, title, body, active }: { step: string; title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-xl ${active ? "bg-white/15 ring-1 ring-white/25" : "bg-white/5 ring-1 ring-white/10"} backdrop-blur-sm p-3.5`}>
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-full ${active ? "bg-white text-emerald-700" : "bg-white/15 text-white"} text-[10px] font-bold flex items-center justify-center`}>
          {step}
        </span>
        <span className="text-xs font-bold tracking-wide">{title}</span>
      </div>
      <p className="mt-2 text-[11px] text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const map: Record<string, { tone: string; dot: string }> = {
    draft: { tone: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
    generated: { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" },
    sent: { tone: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
    viewed: { tone: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
    paid: { tone: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  };
  const cfg = map[lower] ?? map.generated;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function Donut({ total, segments }: { total: number; segments: Array<{ value: number; color: string }> }) {
  const size = 110;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = total > 0 ? (s.value / total) * c : 0;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-acc}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        acc += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-slate-500" fontSize="9" fontWeight="600" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
        TOTAL
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="fill-slate-900" fontSize="14" fontWeight="700">
        ₹{formatINRCompact(total)}
      </text>
    </svg>
  );
}

function formatINRCompact(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
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
  accent: "emerald" | "teal" | "amber" | "cyan";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
    cyan: { tile: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
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
