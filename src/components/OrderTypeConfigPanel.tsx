"use client";

import { useEffect, useState } from "react";

/** Business-settings keys this panel manages. */
const KEYS = {
  takeAway: "take_away",
  dineIn: "dine_in",
  homeDelivery: "home_delivery",
} as const;

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

export function OrderTypeConfigPanel() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [takeAway, setTakeAway] = useState(true);
  const [dineIn, setDineIn] = useState(true);
  const [homeDelivery, setHomeDelivery] = useState(true);

  async function load() {
    if (loaded) return;
    const isOn = (v: string | null | undefined) => v == null ? true : /^(true|1|yes|on)$/i.test(String(v));
    try {
      const res = await fetch("/api/admin/business-settings");
      if (res.ok) {
        const data = (await res.json()) as { settings?: SettingRow[] };
        const map = new Map((data.settings ?? []).map((s) => [s.key, s.value]));
        if (map.has(KEYS.takeAway)) setTakeAway(isOn(map.get(KEYS.takeAway)));
        if (map.has(KEYS.dineIn)) setDineIn(isOn(map.get(KEYS.dineIn)));
        if (map.has(KEYS.homeDelivery)) setHomeDelivery(isOn(map.get(KEYS.homeDelivery)));
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
            { key: KEYS.takeAway, value: takeAway ? "1" : "0" },
            { key: KEYS.dineIn, value: dineIn ? "1" : "0" },
            { key: KEYS.homeDelivery, value: homeDelivery ? "1" : "0" },
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
            <h2 className="text-base font-semibold text-slate-900">Order type configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enable or disable Take Away, Dine In and Home Delivery for customers.</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Take Away</div>
                    <div className="text-xs text-slate-500">Pickup orders.</div>
                  </div>
                  <Toggle on={takeAway} onClick={() => setTakeAway((v) => !v)} />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Dine In</div>
                    <div className="text-xs text-slate-500">Eat-at-restaurant orders.</div>
                  </div>
                  <Toggle on={dineIn} onClick={() => setDineIn((v) => !v)} />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Home Delivery</div>
                    <div className="text-xs text-slate-500">Doorstep delivery orders.</div>
                  </div>
                  <Toggle on={homeDelivery} onClick={() => setHomeDelivery((v) => !v)} />
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
