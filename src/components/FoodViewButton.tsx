"use client";

import { useState } from "react";

interface FoodDetail {
  food: {
    id: number;
    name?: string | null;
    description?: string | null;
    image_full_url?: string | null;
    price?: number;
    tax?: number;
    discount?: number;
    veg?: boolean;
    status?: boolean;
    request_status?: string | null;
    rejection_reason?: string | null;
    created_at?: string | null;
  };
  restaurant: { id: number; name: string | null } | null;
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{value ?? "—"}</div>
    </div>
  );
}

export function FoodViewButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/food/${id}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setData((await res.json()) as FoodDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  }

  const f = data?.food;
  const inr = (n?: number | null) => `₹${Math.round(Number(n ?? 0)).toLocaleString("en-IN")}`;
  const rs = (f?.request_status ?? "pending").toLowerCase();

  return (
    <>
      <button
        onClick={load}
        title="View item"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors align-middle"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-40 bg-slate-100">
              {f?.image_full_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.image_full_url} alt={f?.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">🍽️</div>
              )}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:bg-white flex items-center justify-center shadow"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">{f?.name ?? "Food item"}</h2>
                <div className="text-xs text-slate-400 font-mono">#{id}</div>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  rs === "approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : rs === "denied"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {rs === "denied" ? "Rejected" : rs === "approved" ? "Approved" : "Pending review"}
              </span>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loading && <div className="py-10 text-center text-slate-400 text-sm">Loading details…</div>}
              {error && <div className="py-10 text-center text-rose-500 text-sm">{error}</div>}

              {f && !loading && (
                <>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Item</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Restaurant" value={data?.restaurant?.name ?? "—"} />
                      <KV label="Price" value={inr(f.price)} />
                      <KV label="Tax" value={`${f.tax ?? 0}%`} />
                      <KV label="Discount" value={f.discount ?? 0} />
                      <KV label="Food type" value={f.veg ? "Veg" : "Non-veg"} />
                      <KV label="Currently live" value={f.status ? "Yes" : "No"} />
                    </div>
                  </section>

                  {f.description ? (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{f.description}</p>
                    </section>
                  ) : null}

                  {rs === "denied" && f.rejection_reason ? (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Rejection remark</h3>
                      <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                        {f.rejection_reason}
                      </div>
                    </section>
                  ) : null}
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
