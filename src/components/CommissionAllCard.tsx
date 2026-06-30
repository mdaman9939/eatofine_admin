"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Single-place commission control: set one % and apply it to EVERY restaurant
 *  (existing) + the new-registration default. Posts to the admin proxy. */
export function CommissionAllCard({ current }: { current: number }) {
  const router = useRouter();
  const [rate, setRate] = useState(String(current ?? ""));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function apply() {
    const r = Number(rate);
    if (!Number.isFinite(r) || r < 0 || r > 100) {
      setMsg({ ok: false, text: "Enter a valid commission % (0–100)." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/restaurants/set-commission-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: r }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j?.ok) {
        setMsg({ ok: true, text: `✓ ${j.rate}% commission applied to all ${j.restaurants} restaurants (+ set as new-registration default).` });
        router.refresh();
      } else {
        setMsg({ ok: false, text: j?.errors?.[0]?.message || "Failed to apply commission." });
      }
    } catch {
      setMsg({ ok: false, text: "Network error — please retry." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-900">Commission / PPO — all restaurants</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
        Platform commission charged on every restaurant&apos;s food sales (this is the admin&apos;s income). Set it
        <b> once here</b> — it applies to <b>every restaurant</b> immediately and becomes the default for new
        registrations. GST is added separately on top (per the Service CGST/SGST rates above). You can still
        override a single restaurant from Restaurants → Edit.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Commission rate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.5"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="button"
          onClick={apply}
          disabled={busy}
          className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Applying…" : "Apply to all restaurants"}
        </button>
      </div>
      {msg && <p className={`mt-3 text-sm font-medium ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
    </div>
  );
}
