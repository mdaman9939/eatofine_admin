import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { DisbursementDetailsTable, type DisbRow } from "../../../../components/DisbursementDetailsTable";

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

const COMPLETED = new Set(["disbursed", "completed"]);

/** Per-scope KPI totals — amounts by status + counts. */
function breakdown(rows: DisbRow[]) {
  const sum = (pred: (r: DisbRow) => boolean) => rows.filter(pred).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return {
    count: rows.length,
    total: rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    disbursed: sum((r) => COMPLETED.has(r.status)),
    pending: sum((r) => r.status === "pending"),
    inProcess: sum((r) => r.status === "processing"),
  };
}

function BreakdownSection({ title, b }: { title: string; b: ReturnType<typeof breakdown> }) {
  const tiles = [
    { label: "Total Number of disbursement", value: b.count.toString() },
    { label: "Total Amount", value: inr(b.total) },
    { label: "Disbursed Amount", value: inr(b.disbursed) },
    { label: "Pending amount", value: inr(b.pending) },
    { label: "In process amount", value: inr(b.inProcess) },
  ];
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{t.label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{t.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function DisbursementReportPage() {
  const [restRes, dmRes] = await Promise.all([
    adminFetch<{ items: DisbRow[] }>("/admin/disbursements?type=restaurant&limit=300").catch(() => ({ items: [] as DisbRow[] })),
    adminFetch<{ items: DisbRow[] }>("/admin/disbursements?type=deliveryman&limit=300").catch(() => ({ items: [] as DisbRow[] })),
  ]);
  const restaurant = restRes.items ?? [];
  const deliveryman = dmRes.items ?? [];
  const overall = breakdown([...restaurant, ...deliveryman]);

  return (
    <>
      <ReportTemplate
        badge="SYSTEM · REPORTS"
        title="Disbursement Report"
        description="History of payouts to restaurants and delivery men. Status, amount, recipient."
        stats={[
          { label: "Total Number of disbursement", value: overall.count.toString(), accent: "blue" },
          { label: "Total Amount", value: inr(overall.total), accent: "slate" },
          { label: "Disbursed Amount", value: inr(overall.disbursed), accent: "emerald" },
          { label: "Pending amount", value: inr(overall.pending), accent: "rose" },
          { label: "In process amount", value: inr(overall.inProcess), accent: "amber" },
        ]}
      />
      <div className="px-8 -mt-2 space-y-6">
        <BreakdownSection title="Restaurant Disbursement Breakdown" b={breakdown(restaurant)} />
        <BreakdownSection title="Deliveryman Disbursement Breakdown" b={breakdown(deliveryman)} />
      </div>
      <div className="px-8 pb-8 pt-6">
        <DisbursementDetailsTable restaurant={restaurant} deliveryman={deliveryman} />
      </div>
    </>
  );
}
