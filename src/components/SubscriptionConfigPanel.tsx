"use client";

import { useEffect, useState } from "react";

const KEYS = {
  status: "subscription_status",
  frequencies: "subscription_frequencies",
  canPause: "subscription_can_pause",
  maxPerCustomer: "subscription_max_per_customer",
  minDays: "subscription_min_days",
} as const;

const FREQS = ["daily", "weekly", "monthly"] as const;

interface SettingRow { key: string; value: string | null }

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-emerald-500" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export function SubscriptionConfigPanel() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [freqs, setFreqs] = useState<Set<string>>(new Set(["daily", "weekly"]));
  const [canPause, setCanPause] = useState(true);
  const [maxPerCustomer, setMaxPerCustomer] = useState("0");
  const [minDays, setMinDays] = useState("1");

  async function load() {
    if (loaded) return;
    try {
      const res = await fetch("/api/admin/business-settings?prefix=subscription_");
      if (res.ok) {
        const data = (await res.json()) as { settings?: SettingRow[] };
        const map = new Map((data.settings ?? []).map((s) => [s.key, s.value]));
        const st = map.get(KEYS.status);
        if (st != null) setEnabled(/^(true|1|yes|on)$/i.test(String(st)));
        const fr = map.get(KEYS.frequencies);
        if (fr != null) setFreqs(new Set(String(fr).split(",").map((x) => x.trim()).filter(Boolean)));
        const cp = map.get(KEYS.canPause);
        if (cp != null) setCanPause(/^(true|1|yes|on)$/i.test(String(cp)));
        if (map.get(KEYS.maxPerCustomer) != null) setMaxPerCustomer(String(map.get(KEYS.maxPerCustomer)));
        if (map.get(KEYS.minDays) != null) setMinDays(String(map.get(KEYS.minDays)));
      }
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

  function toggleFreq(f: string) {
    setFreqs((s) => {
      const n = new Set(s);
      if (n.has(f)) n.delete(f); else n.add(f);
      return n;
    });
  }

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
            { key: KEYS.frequencies, value: FREQS.filter((f) => freqs.has(f)).join(",") },
            { key: KEYS.canPause, value: canPause ? "1" : "0" },
            { key: KEYS.maxPerCustomer, value: num(maxPerCustomer) },
            { key: KEYS.minDays, value: num(minDays) },
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
            <h2 className="text-base font-semibold text-slate-900">Subscription order configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Control whether customers can subscribe, allowed frequencies and limits.</p>
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
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Subscription ordering</div>
                    <div className="text-xs text-slate-500">Off = customers cannot start new subscriptions.</div>
                  </div>
                  <Toggle on={enabled} onClick={() => setEnabled((v) => !v)} />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Customers can pause</div>
                    <div className="text-xs text-slate-500">Allow customers to pause/resume their plan.</div>
                  </div>
                  <Toggle on={canPause} onClick={() => setCanPause((v) => !v)} />
                </label>

                <div className="sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-600">Allowed delivery frequencies</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {FREQS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFreq(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                          freqs.has(f) ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Max active subscriptions / customer</span>
                  <input type="number" min={0} value={maxPerCustomer} onChange={(e) => setMaxPerCustomer(e.target.value)} className={`${sel} w-full mt-1`} placeholder="0 = unlimited" />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Minimum subscription length (days)</span>
                  <input type="number" min={0} value={minDays} onChange={(e) => setMinDays(e.target.value)} className={`${sel} w-full mt-1`} />
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
