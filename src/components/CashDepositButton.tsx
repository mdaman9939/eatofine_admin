"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Record that a rider deposited COD cash back to the platform. Reduces the
 * rider's `collected_cash` (never below zero) via
 * POST /api/admin/delivery-men/:id/cash-deposit.
 */
export function CashDepositButton({ dmId, collectedCash }: { dmId: number; collectedCash: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(collectedCash > 0 ? collectedCash : ""));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError("Enter an amount greater than 0."); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/delivery-men/${dmId}/cash-deposit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 160)); return; }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setAmount(String(collectedCash > 0 ? collectedCash : "")); setError(null); setOpen(true); }}
        disabled={collectedCash <= 0}
        className="bg-amber-100 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
      >
        Record cash deposit
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Record COD cash deposit</h3>
            <p className="text-xs text-slate-500 mb-3">Rider is holding <strong>₹{collectedCash.toFixed(2)}</strong> COD cash. Enter the amount deposited back to the platform.</p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Amount ₹</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500" />
            </label>
            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2">
                {pending ? "Saving…" : "Record deposit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
