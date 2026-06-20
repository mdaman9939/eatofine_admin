import Link from "next/link";
import { adminFetch } from "../../../lib/api";

/**
 * Billing Center — a single, client-friendly hub that explains and links the
 * THREE GST documents the platform produces:
 *   1. Customer Tax Invoice   (OBR… + ETFU…)   — issued to the customer per order
 *   2. Credit Note            (CNOBR… + CNETU…) — auto-issued on cancel/refund
 *   3. Restaurant/Vendor Inv. (RES…)            — Eatofine bills the restaurant
 *
 * Every card links to its list (which opens the printable, PDF-faithful page).
 * Counts are best-effort — a failed fetch shows "—" rather than crashing.
 */

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default async function BillingCenterPage() {
  const [custInv, cnStats, vendStats] = await Promise.all([
    safe(adminFetch<{ total: number }>("/admin/invoices?limit=1")),
    safe(adminFetch<{ total_count: number; total_value: number }>("/admin/credit-notes/stats")),
    safe(adminFetch<{ total_count: number; total_value: number; outstanding_value: number }>("/admin/vendor-invoices/stats")),
  ]);

  const cards = [
    {
      key: "customer",
      href: "/dashboard/invoices",
      accent: "emerald",
      badge: "OBR… + ETFU…",
      title: "Customer Tax Invoice",
      tagline: "Issued to the customer for every order",
      count: custInv?.total ?? null,
      countLabel: "invoices",
      value: null as number | null,
      points: [
        "2 pages — Page 1: restaurant food (HSN 996331), Page 2: Eatofine delivery + platform service (HSN 999799)",
        "Restaurant GST split CGST + SGST (or IGST if inter-state)",
        "Auto-numbered OBR…/ETFU… on first view; one invoice per order",
      ],
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      ),
    },
    {
      key: "credit",
      href: "/dashboard/credit-notes",
      accent: "amber",
      badge: "CNOBR… + CNETU…",
      title: "Credit Note",
      tagline: "Auto-issued when an order is cancelled / refunded",
      count: cnStats?.total_count ?? null,
      countLabel: "credit notes",
      value: cnStats?.total_value ?? null,
      points: [
        "Reverses the original invoice's tax + delivery so GST reconciles",
        "Carries the Reference Invoice no (CNOBR → original OBR, CNETU → original ETFU) + date",
        "Created the moment the refund hits the customer wallet",
      ],
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
      ),
    },
    {
      key: "vendor",
      href: "/dashboard/vendor-invoices",
      accent: "indigo",
      badge: "RES…",
      title: "Restaurant / Vendor Invoice",
      tagline: "Eatofine bills the restaurant (monthly platform usage)",
      count: vendStats?.total_count ?? null,
      countLabel: "invoices",
      value: vendStats?.total_value ?? null,
      points: [
        "“Online platform usage Fee” — commission / subscription for the period",
        "HSN 998599 (Support Service), CGST 9% + SGST 9%",
        "Generated per billing period from the restaurant's orders",
      ],
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
      ),
    },
  ];

  const palette: Record<string, { ring: string; tile: string; text: string; bg: string; cta: string; chip: string }> = {
    emerald: { ring: "ring-emerald-200 hover:ring-emerald-300", tile: "bg-emerald-100 text-emerald-700", text: "text-emerald-700", bg: "from-emerald-50/70 to-white", cta: "from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    amber:   { ring: "ring-amber-200 hover:ring-amber-300",     tile: "bg-amber-100 text-amber-700",     text: "text-amber-700",   bg: "from-amber-50/70 to-white",   cta: "from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500",   chip: "bg-amber-50 text-amber-700 ring-amber-200" },
    indigo:  { ring: "ring-indigo-200 hover:ring-indigo-300",   tile: "bg-indigo-100 text-indigo-700",   text: "text-indigo-700",  bg: "from-indigo-50/70 to-white",  cta: "from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600", chip: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  };

  return (
    <div className="relative p-8 space-y-7">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
            GST · Billing Center
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Invoices &amp; GST Documents</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-3xl">
            Everything billing in one place. The platform produces <b>three</b> GST-compliant
            documents — open any card to view the list and print the exact PDF. All are
            computer-generated and need no signature.
          </p>
        </div>
      </div>

      {/* ── The three documents ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {cards.map((c, i) => {
          const p = palette[c.accent];
          return (
            <Link
              key={c.key}
              href={c.href}
              className={`group relative flex flex-col bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 ring-1 ${p.ring} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 overflow-hidden`}
            >
              <span className="absolute top-5 right-5 text-5xl font-black text-slate-900/5 select-none">{i + 1}</span>
              <div className="flex items-center justify-between gap-2">
                <span className={`w-12 h-12 rounded-xl ${p.tile} flex items-center justify-center shadow-sm`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{c.icon}</svg>
                </span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ring-1 ${p.chip}`}>{c.badge}</span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">{c.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{c.tagline}</p>

              <div className="mt-4 flex items-end gap-4">
                <div>
                  <div className={`text-2xl font-bold tabular-nums ${p.text}`}>{c.count ?? "—"}</div>
                  <div className="text-[11px] text-slate-400">{c.countLabel}</div>
                </div>
                {c.value != null && (
                  <div className="pb-0.5">
                    <div className="text-sm font-semibold text-slate-700 tabular-nums">{money(c.value)}</div>
                    <div className="text-[11px] text-slate-400">total value</div>
                  </div>
                )}
              </div>

              <ul className="mt-4 space-y-1.5 flex-1">
                {c.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[12px] text-slate-600 leading-snug">
                    <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${p.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                    </svg>
                    {pt}
                  </li>
                ))}
              </ul>

              <span className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b ${p.cta} text-white text-sm font-semibold px-4 py-2 shadow-sm transition`}>
                View all &amp; print
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── How the three fit together ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How the three documents fit together
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-7 gap-2 items-stretch text-center">
          <FlowStep tone="emerald" step="Order placed &amp; paid" desc="Customer Tax Invoice (OBR + ETFU) is generated for the order" />
          <Arrow />
          <FlowStep tone="amber" step="If cancelled / refunded" desc="Credit Note (CNOBR + CNETU) auto-issues, referencing that invoice" />
          <Arrow />
          <FlowStep tone="indigo" step="Each billing period" desc="Vendor Invoice (RES) bills the restaurant for platform usage" />
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
          <Note label="Who pays whom">
            Customer Invoice → customer pays for the order. Credit Note → money returns to the
            customer. Vendor Invoice → restaurant pays Eatofine its commission.
          </Note>
          <Note label="GST treatment">
            Restaurant food &amp; service: CGST + SGST within the same state, IGST across states
            (chosen automatically by place of supply). Platform fee to restaurant: 9% + 9%.
          </Note>
          <Note label="Compliance">
            Every document is computer-generated (no signature), sequentially numbered per
            financial year, and carries HSN codes + the reference invoice for audit.
          </Note>
        </div>
      </div>

      {/* ── Quick links footer ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Shortcuts:</span>
        <Link href="/dashboard/invoices" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium">Customer Invoices</Link>
        <Link href="/dashboard/credit-notes" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium">Credit Notes</Link>
        <Link href="/dashboard/vendor-invoices" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium">Vendor Invoices</Link>
        <Link href="/dashboard/invoice-setup" className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium">Invoice Setup</Link>
      </div>
    </div>
  );
}

function FlowStep({ tone, step, desc }: { tone: "emerald" | "amber" | "indigo"; step: string; desc: string }) {
  const map = {
    emerald: "bg-emerald-50 ring-emerald-200 text-emerald-800",
    amber: "bg-amber-50 ring-amber-200 text-amber-800",
    indigo: "bg-indigo-50 ring-indigo-200 text-indigo-800",
  };
  return (
    <div className={`md:col-span-2 rounded-xl ring-1 ${map[tone]} px-3 py-3`}>
      <div className="font-bold text-sm" dangerouslySetInnerHTML={{ __html: step }} />
      <div className="text-[11px] mt-1 opacity-80 leading-snug">{desc}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden md:flex items-center justify-center text-slate-300">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7M3 12h18" />
      </svg>
    </div>
  );
}

function Note({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <p className="text-slate-600 leading-snug">{children}</p>
    </div>
  );
}
