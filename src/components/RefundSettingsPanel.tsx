"use client";

import { useEffect, useState } from "react";

/** Business-settings keys this panel manages. */
const KEYS = {
  active: "refund_active_status",
  method: "refund_default_method",
  autoLimit: "refund_auto_approve_limit",
  bearer: "refund_cost_bearer",
} as const;

interface SettingRow { key: string; value: string | null }

export function RefundSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState(true);
  const [method, setMethod] = useState("wallet");
  const [autoLimit, setAutoLimit] = useState("0");
  const [bearer, setBearer] = useState("admin");

  async function load() {
    setOpen(true);
    if (loaded) return;
    try {
      const res = await fetch("/api/admin/business-settings?prefix=refund_");
      if (res.ok) {
        const data = (await res.json()) as { settings?: SettingRow[] };
        const map = new Map((data.settings ?? []).map((s) => [s.key, s.value]));
        const a = map.get(KEYS.active);
        if (a != null) setActive(/^(true|1|yes|on)$/i.test(String(a)));
        if (map.get(KEYS.method)) setMethod(String(map.get(KEYS.method)));
        if (map.get(KEYS.autoLimit) != null) setAutoLimit(String(map.get(KEYS.autoLimit)));
        if (map.get(KEYS.bearer)) setBearer(String(map.get(KEYS.bearer)));
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
    try {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          settings: [
            { key: KEYS.active, value: active ? "1" : "0" },
            { key: KEYS.method, value: method },
            { key: KEYS.autoLimit, value: String(Math.max(0, Number(autoLimit) || 0)) },
            { key: KEYS.bearer, value: bearer },
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
            <h2 className="text-base font-semibold text-slate-900">Refund configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Control how refunds behave platform-wide.</p>
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
                {/* Refunds enabled */}
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Refunds enabled</div>
                    <div className="text-xs text-slate-500">Turn the whole refund flow on or off.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : ""}`} />
                  </button>
                </label>

                {/* Default refund method */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Default refund method</span>
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${sel} w-full mt-1`}>
                    <option value="wallet">Customer wallet</option>
                    <option value="original_payment_method">Original payment method</option>
                  </select>
                </label>

                {/* Auto-approve limit */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Auto-approve up to ₹</span>
                  <input
                    type="number"
                    min={0}
                    value={autoLimit}
                    onChange={(e) => setAutoLimit(e.target.value)}
                    className={`${sel} w-full mt-1`}
                    placeholder="0 = always manual"
                  />
                  <span className="text-[11px] text-slate-400">Requests at or below this amount are approved automatically. 0 = always manual.</span>
                </label>

                {/* Cost bearer */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Who bears the refund cost</span>
                  <select value={bearer} onChange={(e) => setBearer(e.target.value)} className={`${sel} w-full mt-1`}>
                    <option value="admin">Admin / platform</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="split">Split (as per policy)</option>
                  </select>
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
