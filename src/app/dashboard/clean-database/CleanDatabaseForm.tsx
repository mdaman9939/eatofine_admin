"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const CLEANABLE = [
  { collection: "orders", label: "Orders", description: "All order records (also wipes order_details)" },
  { collection: "order_details", label: "Order items", description: "Line items inside orders" },
  { collection: "reviews", label: "Food reviews", description: "Customer reviews on food items" },
  { collection: "restaurant_reviews", label: "Restaurant reviews", description: "Customer ratings of restaurants" },
  { collection: "dm_reviews", label: "DM reviews", description: "Customer ratings of delivery men" },
  { collection: "notifications", label: "Notifications", description: "System notifications to users" },
  { collection: "conversations", label: "Chat conversations", description: "Customer ↔ vendor / DM threads" },
  { collection: "messages", label: "Chat messages", description: "Individual messages inside conversations" },
  { collection: "contact_messages", label: "Contact form submissions", description: "Inbox of \"Contact Us\" form" },
  { collection: "newsletter_subscribers", label: "Newsletter subscribers", description: "Public newsletter signups" },
  { collection: "banners", label: "Banners", description: "Home-screen carousel banners" },
  { collection: "promotional_banners", label: "Promotional banners", description: "Larger hero promo banners" },
  { collection: "advertisements", label: "Advertisements", description: "Paid restaurant ads" },
  { collection: "campaigns", label: "Campaigns", description: "Restaurant + food promotional campaigns" },
  { collection: "coupons", label: "Coupons", description: "Discount codes" },
  { collection: "wishlists", label: "Wishlists", description: "Customer favourite foods + restaurants" },
  { collection: "customer_addresses", label: "Customer addresses", description: "Saved delivery addresses" },
  { collection: "dm_incentives", label: "DM incentives", description: "Delivery-man performance claims" },
  { collection: "dm_bonuses", label: "DM bonus rules", description: "Configured bonus rules" },
  { collection: "activity_logs", label: "Activity logs", description: "Audit trail of admin actions" },
];

export function CleanDatabaseForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(col: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  function run() {
    setError(null);
    setResult(null);
    if (selected.size === 0) {
      setError("Select at least one collection to clean.");
      return;
    }
    if (confirm !== "DELETE") {
      setError(`Type "DELETE" in the confirm field to proceed.`);
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/clean-database`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collections: Array.from(selected), confirm }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      const data = await res.json() as { cleared: Record<string, number> };
      setResult(data.cleared);
      setSelected(new Set());
      setConfirm("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-5">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-rose-900">
            <p className="font-semibold">DANGER — irreversible operation</p>
            <p className="text-xs mt-1 leading-relaxed">
              This permanently deletes ALL records in the selected collections. Wallets, employees, admins, settings, vendors, and zones are <strong>never</strong> touched. Type <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">DELETE</code> to confirm.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Select collections to wipe</h2>
          <p className="text-xs text-slate-500 mt-0.5">{selected.size} selected.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {CLEANABLE.map((c) => (
            <label
              key={c.collection}
              className="flex items-start gap-3 px-6 py-3 hover:bg-rose-50/30 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(c.collection)}
                onChange={() => toggle(c.collection)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-2 focus:ring-rose-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900">{c.label}</div>
                <div className="text-xs text-slate-500">{c.description}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.collection}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-rose-300 shadow-sm p-6 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Type DELETE to confirm</span>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="mt-1 block w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all"
          />
        </label>

        {error && <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">{error}</div>}

        {result && (
          <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <p className="font-semibold mb-1">✓ Cleanup complete:</p>
            <ul className="space-y-0.5">
              {Object.entries(result).map(([col, count]) => (
                <li key={col} className="font-mono">
                  {col} → {count >= 0 ? `${count} deleted` : "rejected (not in whitelist)"}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={run}
          disabled={pending || selected.size === 0 || confirm !== "DELETE"}
          className="cursor-pointer w-full rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-3 shadow-md transition-all"
        >
          {pending ? "Cleaning…" : `Wipe ${selected.size} collection${selected.size === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}
