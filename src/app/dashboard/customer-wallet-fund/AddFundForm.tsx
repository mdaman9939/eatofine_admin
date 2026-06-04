"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AddFundForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; amount: number; balance: number } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!userId || !amount) {
      setError("Customer ID and amount are required");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/customer-wallet/add-fund`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          amount: Number(amount),
          reason: reason || "Admin credit",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 200));
        return;
      }
      const data = await res.json() as { customer_name: string; amount: number; new_balance: number };
      setSuccess({ name: data.customer_name, amount: data.amount, balance: data.new_balance });
      setUserId("");
      setAmount("");
      setReason("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Credit a customer</h2>
        <p className="text-xs text-slate-500 mt-0.5">Adds funds to the customer&apos;s wallet and records an audit entry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Customer ID *</span>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            min="1"
            step="1"
            placeholder="e.g. 1"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Amount ₹ *</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="any"
            onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
            placeholder="100"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Reason</span>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Refund for cancelled order #123 · Compensation for delay"
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
        />
      </label>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          ✓ Credited <strong>₹{success.amount}</strong> to <strong>{success.name}</strong>. New balance: ₹{success.balance.toFixed(2)}.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 shadow-sm hover:shadow transition-all"
        >
          {pending ? "Crediting…" : "+ Add fund"}
        </button>
      </div>
    </form>
  );
}
