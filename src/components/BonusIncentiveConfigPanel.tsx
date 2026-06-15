"use client";

import { useEffect, useState } from "react";

/** Business-settings keys this panel manages. */
const KEYS = {
  enabled: "dm_incentive_enabled",
  perDelivery: "dm_incentive_per_delivery",
  bonusThreshold: "dm_incentive_bonus_threshold",
  bonusAmount: "dm_incentive_bonus_amount",
  targetPeriod: "dm_incentive_target_period",
  targetDeliveries: "dm_incentive_target_deliveries",
} as const;

interface SettingRow { key: string; value: string | null }

export function BonusIncentiveConfigPanel() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [perDelivery, setPerDelivery] = useState("0");
  const [bonusThreshold, setBonusThreshold] = useState("0");
  const [bonusAmount, setBonusAmount] = useState("0");
  const [targetPeriod, setTargetPeriod] = useState("weekly");
  const [targetDeliveries, setTargetDeliveries] = useState("0");

  async function load() {
    if (loaded) return;
    try {
      const res = await fetch("/api/admin/business-settings?prefix=dm_incentive_");
      if (res.ok) {
        const data = (await res.json()) as { settings?: SettingRow[] };
        const map = new Map((data.settings ?? []).map((s) => [s.key, s.value]));
        const e = map.get(KEYS.enabled);
        if (e != null) setEnabled(/^(true|1|yes|on)$/i.test(String(e)));
        if (map.get(KEYS.perDelivery) != null) setPerDelivery(String(map.get(KEYS.perDelivery)));
        if (map.get(KEYS.bonusThreshold) != null) setBonusThreshold(String(map.get(KEYS.bonusThreshold)));
        if (map.get(KEYS.bonusAmount) != null) setBonusAmount(String(map.get(KEYS.bonusAmount)));
        if (map.get(KEYS.targetPeriod)) setTargetPeriod(String(map.get(KEYS.targetPeriod)));
        if (map.get(KEYS.targetDeliveries) != null) setTargetDeliveries(String(map.get(KEYS.targetDeliveries)));
      }
    } catch {
      /* keep defaults */
    } finally {
      setLoaded(true);
    }
  }

  // Load lazily the first time the panel opens.
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
            { key: KEYS.enabled, value: enabled ? "1" : "0" },
            { key: KEYS.perDelivery, value: num(perDelivery) },
            { key: KEYS.bonusThreshold, value: num(bonusThreshold) },
            { key: KEYS.bonusAmount, value: num(bonusAmount) },
            { key: KEYS.targetPeriod, value: targetPeriod },
            { key: KEYS.targetDeliveries, value: num(targetDeliveries) },
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
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Bonus &amp; Incentive configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Define the rules riders earn incentives and bonuses by.</p>
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
                {/* Program enabled */}
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Bonus &amp; incentive program</div>
                    <div className="text-xs text-slate-500">Turn the whole rider incentive program on or off.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnabled((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
                  </button>
                </label>

                {/* Per-delivery incentive */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Incentive per delivery ₹</span>
                  <input type="number" min={0} value={perDelivery} onChange={(e) => setPerDelivery(e.target.value)} className={`${sel} w-full mt-1`} placeholder="e.g. 10" />
                  <span className="text-[11px] text-slate-400">Extra ₹ credited to the rider for every completed delivery.</span>
                </label>

                {/* Target period */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Target period</span>
                  <select value={targetPeriod} onChange={(e) => setTargetPeriod(e.target.value)} className={`${sel} w-full mt-1`}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <span className="text-[11px] text-slate-400">Window the bonus target is measured over.</span>
                </label>

                {/* Bonus threshold */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Bonus after (deliveries)</span>
                  <input type="number" min={0} value={bonusThreshold} onChange={(e) => setBonusThreshold(e.target.value)} className={`${sel} w-full mt-1`} placeholder="e.g. 50" />
                  <span className="text-[11px] text-slate-400">Deliveries a rider must complete in the period to earn the bonus.</span>
                </label>

                {/* Bonus amount */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Bonus amount ₹</span>
                  <input type="number" min={0} value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} className={`${sel} w-full mt-1`} placeholder="e.g. 500" />
                  <span className="text-[11px] text-slate-400">One-time bonus paid when the threshold is hit.</span>
                </label>

                {/* Target deliveries (informational target) */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Period delivery target</span>
                  <input type="number" min={0} value={targetDeliveries} onChange={(e) => setTargetDeliveries(e.target.value)} className={`${sel} w-full mt-1`} placeholder="e.g. 100" />
                  <span className="text-[11px] text-slate-400">Goal shown to riders for the period (motivational target).</span>
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
