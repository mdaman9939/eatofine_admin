"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Editor for a situational delivery surcharge (weekend / festival / late-night).
 * Works for both the Partner Charges and User Charges pages — pass the matching
 * `basePath` ("/dm-charges/surcharges" or "/user-delivery-charges/surcharges")
 * and `showGst` (user side carries its own GST; DM side does not).
 *
 * Handles the type-specific trigger config_json:
 *   weekend    → { days: number[] }            (0=Sun … 6=Sat)
 *   festival   → { dates: string[] }           (YYYY-MM-DD)
 *   late_night → { start: "HH:MM", end: "HH:MM" }
 *
 * In "edit" mode the surcharge_type is fixed (the backend doesn't allow changing
 * it); in "create" mode it can be picked.
 */

type SurchargeType = "weekend" | "festival" | "late_night";
type ValueType = "fixed" | "percentage";

interface SurchargeValue {
  id: number;
  surcharge_type: SurchargeType | "surge";
  label: string;
  config_json: unknown;
  surcharge_type_value: string;
  amount: number;
  gst_rate?: number;
  status: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SituationalSurchargeEditor({
  basePath,
  showGst = false,
  mode = "edit",
  surcharge,
}: {
  basePath: string;
  showGst?: boolean;
  mode?: "edit" | "create";
  surcharge?: SurchargeValue;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialType: SurchargeType =
    surcharge && surcharge.surcharge_type !== "surge" ? surcharge.surcharge_type : "weekend";
  const cfg = (surcharge?.config_json as Record<string, unknown>) ?? {};

  const [type, setType] = useState<SurchargeType>(initialType);
  const [label, setLabel] = useState(surcharge?.label ?? "");
  const [valueType, setValueType] = useState<ValueType>(
    surcharge?.surcharge_type_value === "percentage" ? "percentage" : "fixed",
  );
  const [amount, setAmount] = useState(String(surcharge?.amount ?? ""));
  const [gst, setGst] = useState(String(surcharge?.gst_rate ?? 18));
  const [active, setActive] = useState(surcharge?.status ?? true);

  // Type-specific trigger inputs
  const [days, setDays] = useState<number[]>(Array.isArray(cfg.days) ? (cfg.days as number[]) : []);
  const [dates, setDates] = useState<string>(Array.isArray(cfg.dates) ? (cfg.dates as string[]).join(", ") : "");
  const [start, setStart] = useState<string>(typeof cfg.start === "string" ? cfg.start : "22:00");
  const [end, setEnd] = useState<string>(typeof cfg.end === "string" ? cfg.end : "06:00");

  function buildConfig(): unknown {
    if (type === "weekend") return { days: [...days].sort((a, b) => a - b) };
    if (type === "festival") {
      const list = dates.split(",").map((d) => d.trim()).filter(Boolean);
      return { dates: list };
    }
    return { start, end };
  }

  function toggleDay(d: number) {
    setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));
  }

  function save() {
    setError(null);
    const amt = Number(amount);
    if (!label.trim()) { setError("Label is required."); return; }
    if (!Number.isFinite(amt) || amt < 0) { setError("Amount must be 0 or more."); return; }
    const config_json = buildConfig();

    const body: Record<string, unknown> = {
      label: label.trim(),
      config_json,
      surcharge_type_value: valueType,
      amount: amt,
      status: active,
    };
    if (showGst) body.gst_rate = Number(gst) || 0;
    if (mode === "create") body.surcharge_type = type;

    startTransition(async () => {
      const url = mode === "create"
        ? `/api/admin${basePath}`
        : `/api/admin${basePath}/${surcharge!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 160)); return; }
      setOpen(false);
      router.refresh();
    });
  }

  const inputCls = "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setOpen(true); }}
        className={mode === "create"
          ? "cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 shadow-sm"
          : "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 text-xs font-semibold"}
      >
        {mode === "create" ? "+ New surcharge" : "Edit"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 max-h-[88vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-3">
              {mode === "create" ? "New situational surcharge" : `Edit surcharge #${surcharge!.id}`}
            </h3>

            <div className="space-y-3 text-left">
              {/* Type — editable only on create (backend keeps it immutable on edit) */}
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Type</span>
                {mode === "create" ? (
                  <select value={type} onChange={(e) => setType(e.target.value as SurchargeType)} className={inputCls}>
                    <option value="weekend">Weekend</option>
                    <option value="festival">Festival</option>
                    <option value="late_night">Late night</option>
                  </select>
                ) : (
                  <div className="mt-1 text-sm font-medium text-slate-800 capitalize">{type.replace("_", " ")}</div>
                )}
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Label</span>
                <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="e.g. Weekend uplift" />
              </label>

              {/* Type-specific trigger */}
              {type === "weekend" && (
                <div>
                  <span className="text-xs font-semibold text-slate-600">Days</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`text-xs rounded-md px-2.5 py-1 border ${days.includes(i) ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {type === "festival" && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Dates (YYYY-MM-DD, comma separated)</span>
                  <textarea value={dates} onChange={(e) => setDates(e.target.value)} className={inputCls + " min-h-[56px]"} placeholder="2026-10-21, 2026-12-25" />
                </label>
              )}
              {type === "late_night" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Start (HH:MM)</span>
                    <input value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} placeholder="22:00" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">End (HH:MM)</span>
                    <input value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} placeholder="06:00" />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Amount type</span>
                  <select value={valueType} onChange={(e) => setValueType(e.target.value as ValueType)} className={inputCls}>
                    <option value="fixed">Fixed ₹</option>
                    <option value="percentage">Percentage %</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">{valueType === "percentage" ? "Amount %" : "Amount ₹"}</span>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} inputMode="decimal" />
                </label>
              </div>

              {showGst && (
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">GST %</span>
                  <input value={gst} onChange={(e) => setGst(e.target.value)} className={inputCls} inputMode="decimal" />
                </label>
              )}

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <span className="text-xs font-semibold text-slate-600">Active</span>
              </label>
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 mt-3">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2">
                {pending ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
