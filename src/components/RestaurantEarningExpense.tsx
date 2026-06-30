"use client";

import { PaginatedTable } from "./PaginatedTable";
import { CsvExportButton } from "./CsvExportButton";

/** One delivered+paid order, shown in the Earning table. */
interface EarnRow {
  sr: number;
  order_id: number;
  zone: string | null;
  restaurant: string | null;
  customer: string | null;
  date: string | null;
  item_value: number;
  total_earning: number;
}

/** Same order, shown in the Expense table. */
interface ExpRow {
  sr: number;
  order_id: number;
  zone: string | null;
  restaurant: string | null;
  customer: string | null;
  date: string | null;
  admin_fee: number;
  discount: number;
  tds: number;
  total_expense: number;
}

export interface RestaurantEarningExpenseData {
  earnings: EarnRow[];
  expenses: ExpRow[];
  totals: {
    orders: number;
    item_value: number;
    total_earning: number;
    admin_fee: number;
    discount: number;
    tds: number;
    total_expense: number;
  };
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

const TH = "px-4 py-3 font-semibold";
const TD = "px-4 py-3 text-slate-700";

export function RestaurantEarningExpense({ data }: { data: RestaurantEarningExpenseData }) {
  const { earnings, expenses, totals } = data;

  // CSV columns mirror the client's "Restaurant Earning and Expense Report"
  // headers exactly, so the exported file matches their template 1:1.
  const earnCsvCols = [
    { key: "sr", label: "Sr" },
    { key: "order_id", label: "Order Id" },
    { key: "zone", label: "Zone" },
    { key: "restaurant", label: "Restaurant Name" },
    { key: "customer", label: "Customer Name" },
    { key: "date", label: "Date" },
    { key: "item_value", label: "Total Item Value" },
    { key: "total_earning", label: "Total Earning (Net to restaurant)" },
  ];
  const earnCsvRows = earnings.map((r) => ({ ...r, date: fmtDate(r.date) }));

  const expCsvCols = [
    { key: "sr", label: "Sr" },
    { key: "order_id", label: "Order Id" },
    { key: "zone", label: "Zone" },
    { key: "restaurant", label: "Restaurant Name" },
    { key: "customer", label: "Customer Name" },
    { key: "date", label: "Date" },
    { key: "admin_fee", label: "Admin Fee (PPO + GST)" },
    { key: "discount", label: "Spent on Discount" },
    { key: "tds", label: "TDS" },
    { key: "total_expense", label: "Total Expense" },
  ];
  const expCsvRows = expenses.map((r) => ({ ...r, date: fmtDate(r.date) }));

  return (
    <div className="space-y-8">
      {/* ── EARNING ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHead
          dot="bg-emerald-500"
          title="Earning"
          subtitle={`${earnings.length} order${earnings.length === 1 ? "" : "s"} · net to restaurant per order`}
          right={<CsvExportButton columns={earnCsvCols} rows={earnCsvRows} filename="restaurant-earning" />}
        />
        <PaginatedTable
          searchable
          pageSize={15}
          colCount={8}
          headerRow={
            <tr>
              <th className={TH}>Sr</th>
              <th className={TH}>Order Id</th>
              <th className={TH}>Zone</th>
              <th className={TH}>Restaurant Name</th>
              <th className={TH}>Customer Name</th>
              <th className={TH}>Date</th>
              <th className={`${TH} text-right`}>Total Item Value</th>
              <th className={`${TH} text-right`}>Total Earning (Net)</th>
            </tr>
          }
          bodyRows={earnings.map((r) => (
            <tr key={`e-${r.order_id}`} className="hover:bg-emerald-50/40">
              <td className={`${TD} tabular-nums text-slate-400 text-xs`}>{r.sr}</td>
              <td className={`${TD} font-mono text-xs`}>#{r.order_id}</td>
              <td className={TD}>{r.zone ?? "—"}</td>
              <td className={`${TD} text-slate-800`}>{r.restaurant ?? "—"}</td>
              <td className={TD}>{r.customer ?? "—"}</td>
              <td className={`${TD} text-xs text-slate-500`}>{fmtDate(r.date)}</td>
              <td className={`${TD} text-right tabular-nums`}>{inr(r.item_value)}</td>
              <td className={`${TD} text-right tabular-nums font-semibold text-emerald-700`}>{inr(r.total_earning)}</td>
            </tr>
          ))}
          searchTexts={earnings.map((r) => `${r.order_id} ${r.zone ?? ""} ${r.restaurant ?? ""} ${r.customer ?? ""}`.toLowerCase())}
          empty="No earnings for this period."
        />
        <TotalsStrip
          items={[
            { label: "Total Item Value", value: inr(totals.item_value), accent: "slate" },
            { label: "Total Earning (Net to restaurant)", value: inr(totals.total_earning), accent: "emerald" },
          ]}
        />
      </section>

      {/* ── EXPENSE ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHead
          dot="bg-rose-500"
          title="Expense"
          subtitle={`${expenses.length} order${expenses.length === 1 ? "" : "s"} · admin fee + discount per order`}
          right={<CsvExportButton columns={expCsvCols} rows={expCsvRows} filename="restaurant-expense" />}
        />
        <PaginatedTable
          searchable
          pageSize={15}
          colCount={10}
          headerRow={
            <tr>
              <th className={TH}>Sr</th>
              <th className={TH}>Order Id</th>
              <th className={TH}>Zone</th>
              <th className={TH}>Restaurant Name</th>
              <th className={TH}>Customer Name</th>
              <th className={TH}>Date</th>
              <th className={`${TH} text-right`}>Admin Fee (PPO + GST)</th>
              <th className={`${TH} text-right`}>Spent on Discount</th>
              <th className={`${TH} text-right`}>TDS</th>
              <th className={`${TH} text-right`}>Total Expense</th>
            </tr>
          }
          bodyRows={expenses.map((r) => (
            <tr key={`x-${r.order_id}`} className="hover:bg-rose-50/40">
              <td className={`${TD} tabular-nums text-slate-400 text-xs`}>{r.sr}</td>
              <td className={`${TD} font-mono text-xs`}>#{r.order_id}</td>
              <td className={TD}>{r.zone ?? "—"}</td>
              <td className={`${TD} text-slate-800`}>{r.restaurant ?? "—"}</td>
              <td className={TD}>{r.customer ?? "—"}</td>
              <td className={`${TD} text-xs text-slate-500`}>{fmtDate(r.date)}</td>
              <td className={`${TD} text-right tabular-nums`}>{inr(r.admin_fee)}</td>
              <td className={`${TD} text-right tabular-nums`}>{inr(r.discount)}</td>
              <td className={`${TD} text-right tabular-nums`}>{inr(r.tds)}</td>
              <td className={`${TD} text-right tabular-nums font-semibold text-rose-700`}>{inr(r.total_expense)}</td>
            </tr>
          ))}
          searchTexts={expenses.map((r) => `${r.order_id} ${r.zone ?? ""} ${r.restaurant ?? ""} ${r.customer ?? ""}`.toLowerCase())}
          empty="No expenses for this period."
        />
        <TotalsStrip
          items={[
            { label: "Total Admin Fee (PPO + GST)", value: inr(totals.admin_fee), accent: "slate" },
            { label: "Total Spent on Discount", value: inr(totals.discount), accent: "amber" },
            { label: "Total TDS", value: inr(totals.tds), accent: "amber" },
            { label: "Total Expense", value: inr(totals.total_expense), accent: "rose" },
          ]}
        />
      </section>
    </div>
  );
}

function SectionHead({ dot, title, subtitle, right }: { dot: string; title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <div className="inline-flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

const ACCENT: Record<string, string> = {
  emerald: "from-emerald-50/60 ring-emerald-200 text-emerald-700",
  rose: "from-rose-50/60 ring-rose-200 text-rose-700",
  amber: "from-amber-50/60 ring-amber-200 text-amber-700",
  slate: "from-slate-50/60 ring-slate-200 text-slate-700",
};

function TotalsStrip({ items }: { items: Array<{ label: string; value: string; accent?: keyof typeof ACCENT }> }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((it) => (
        <div key={it.label} className={`bg-gradient-to-b ${ACCENT[it.accent ?? "slate"]} to-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-sm`}>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{it.label}</div>
          <div className="mt-0.5 text-base font-bold tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
