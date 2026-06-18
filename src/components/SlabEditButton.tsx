"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SlabValues {
  id: number;
  min_order_value: number;
  max_order_value: number;
  fixed_charge: number;
  extra_charge: number;
  gst_rate: number;
  gst_on_extra: boolean;
}

/** Inline editor for a business-plan charge slab. Opens a modal pre-filled with
 *  the slab, PATCHes /business-plans/slabs/:id, then refreshes the list. */
export function SlabEditButton({ slab }: { slab: SlabValues }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Raw string state so decimals type cleanly; parsed on submit.
  const [min, setMin] = useState(String(slab.min_order_value));
  const [max, setMax] = useState(String(slab.max_order_value));
  const [fixed, setFixed] = useState(String(slab.fixed_charge));
  const [extra, setExtra] = useState(String(slab.extra_charge));
  const [gst, setGst] = useState(String(slab.gst_rate));
  const [gstOnExtra, setGstOnExtra] = useState(slab.gst_on_extra);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/business-plans/slabs/${slab.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          min_order_value: Number(min) || 0,
          max_order_value: Number(max) || 0,
          fixed_charge: Number(fixed) || 0,
          extra_charge: Number(extra) || 0,
          gst_rate: Number(gst) || 0,
          gst_on_extra: gstOnExtra,
        }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 120));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const field = "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 text-xs font-semibold"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-3">Edit charge slab #{slab.id}</h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Min order ₹</span>
                <input value={min} onChange={(e) => setMin(e.target.value)} className={field} inputMode="decimal" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Max order ₹</span>
                <input value={max} onChange={(e) => setMax(e.target.value)} className={field} inputMode="decimal" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Fixed charge ₹</span>
                <input value={fixed} onChange={(e) => setFixed(e.target.value)} className={field} inputMode="decimal" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Extra charge ₹</span>
                <input value={extra} onChange={(e) => setExtra(e.target.value)} className={field} inputMode="decimal" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">GST %</span>
                <input value={gst} onChange={(e) => setGst(e.target.value)} className={field} inputMode="decimal" />
              </label>
              <label className="flex items-end gap-2 pb-1.5">
                <input type="checkbox" checked={gstOnExtra} onChange={(e) => setGstOnExtra(e.target.checked)} />
                <span className="text-xs font-semibold text-slate-600">GST on extra</span>
              </label>
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 mt-3">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2">
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
