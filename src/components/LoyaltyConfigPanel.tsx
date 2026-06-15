"use client";

import { useEffect, useState } from "react";

const KEYS = {
  status: "loyalty_point_status",
  earnPerPurchase: "loyalty_point_item_purchase_point",
  exchangeRate: "loyalty_point_exchange_rate",
  minTransfer: "minimum_point_to_transfer",
} as const;

interface SettingRow { key: string; value: string | null }

export function LoyaltyConfigPanel() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [earn, setEarn] = useState("1");
  const [rate, setRate] = useState("0");
  const [minTransfer, setMinTransfer] = useState("0");

  async function load() {
    if (loaded) return;
    try {
      const res = await fetch("/api/admin/business-settings?prefix=loyalty_");
      const res2 = await fetch("/api/admin/business-settings?prefix=minimum_point_");
      const merge = new Map<string, string | null>();
      for (const r of [res, res2]) {
        if (r.ok) {
          const data = (await r.json()) as { settings?: SettingRow[] };
          for (const s of data.settings ?? []) merge.set(s.key, s.value);
        }
      }
      const st = merge.get(KEYS.status);
      if (st != null) setEnabled(/^(true|1|yes|on)$/i.test(String(st)));
      if (merge.get(KEYS.earnPerPurchase) != null) setEarn(String(merge.get(KEYS.earnPerPurchase)));
      if (merge.get(KEYS.exchangeRate) != null) setRate(String(merge.get(KEYS.exchangeRate)));
      if (merge.get(KEYS.minTransfer) != null) setMinTransfer(String(merge.get(KEYS.minTransfer)));
    } catch {
      /* keep defaults */
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (open && !loaded) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const num = (v: string) => String(Math.max(0, Number(v) || 0));
    try {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: KEYS.status, value: enabled ? "1" : "0" },
            { key: KEYS.earnPerPurchase, value: num(earn) },
            { key: KEYS.exchangeRate, value: num(rate) },
            { key: KEYS.minTransfer, value: num(minTransfer) },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 160));
      setSavedAt(new Date().toLocaleTimeString("en-IN"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const sel = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-left">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Loyalty points configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Turn loyalty points on or off, and set how customers earn / redeem them.</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-5">
          {!loaded ? (
            <div className="py-6 text-center text-slate-400 text-sm">Loading settings…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Loyalty points</div>
                    <div className="text-xs text-slate-500">Off = customers neither earn nor redeem any points.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnabled((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
                  </button>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Points earned per order item</span>
                  <input type="number" min={0} value={earn} onChange={(e) => setEarn(e.target.value)} className={`${sel} w-full mt-1`} />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Redeem rate (points = ₹1)</span>
                  <input type="number" min={0} value={rate} onChange={(e) => setRate(e.target.value)} className={`${sel} w-full mt-1`} />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Minimum points to redeem</span>
                  <input type="number" min={0} value={minTransfer} onChange={(e) => setMinTransfer(e.target.value)} className={`${sel} w-full mt-1`} />
                </label>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 shadow-sm"
                >
                  {saving ? "Saving…" : "Save configuration"}
                </button>
                {savedAt && <span className="text-xs text-emerald-600">Saved at {savedAt}</span>}
                {error && <span className="text-xs text-rose-600">{error}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
