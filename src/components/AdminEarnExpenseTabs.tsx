"use client";

import { useState } from "react";
import { AdminEarningOrdersTable, type AdminEarningOrderRow } from "./AdminEarningOrdersTable";
import { AdminExpenseOrdersTable, type AdminExpenseOrderRow } from "./AdminExpenseOrdersTable";

/**
 * Earnings / Expenses toggle for the Admin Earning & Expenses report — matches
 * the client's "Recent Transactions" mockup: selecting a tab swaps the whole
 * analysis (the "total as per filter" breakdown cards) AND the order-wise table
 * to reflect that side. Each table component renders its own breakdown + table,
 * so the toggle just chooses which one is shown. Filters are shared (URL-based)
 * and apply to both, exactly as the client's earning/expense filter rows match.
 */
export function AdminEarnExpenseTabs({
  earnRows,
  expenseRows,
}: {
  earnRows: AdminEarningOrderRow[];
  expenseRows: AdminExpenseOrderRow[];
}) {
  const [tab, setTab] = useState<"earnings" | "expenses">("earnings");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab("earnings")}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${tab === "earnings" ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
        >
          Earnings
        </button>
        <button
          type="button"
          onClick={() => setTab("expenses")}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${tab === "expenses" ? "bg-orange-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
        >
          Expenses
        </button>
      </div>

      {tab === "earnings" ? (
        <AdminEarningOrdersTable rows={earnRows} />
      ) : (
        <AdminExpenseOrdersTable rows={expenseRows} />
      )}
    </div>
  );
}
