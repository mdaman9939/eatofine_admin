"use client";

import { useState } from "react";

export interface AdView {
  id: number;
  title: string | null;
  add_type: string | null;
  description?: string | null;
  image_full_url?: string | null;
  cover_image_full_url?: string | null;
  restaurant_name: string | null;
  restaurant_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_paid: boolean;
  amount?: number | null;
  priority: number | null;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{value ?? "—"}</div>
    </div>
  );
}

export function AdvertisementViewButton({ ad }: { ad: AdView }) {
  const [open, setOpen] = useState(false);
  const cover = ad.cover_image_full_url || ad.image_full_url || null;
  const rs = (ad.status ?? "pending").toLowerCase();
  const tone =
    rs === "approved" || rs === "running" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : rs === "denied" ? "bg-rose-50 text-rose-700 border-rose-200"
        : rs === "paused" ? "bg-slate-100 text-slate-600 border-slate-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="View advertisement"
        className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
      >
        👁 view
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
            <div className="relative h-36 bg-gradient-to-br from-emerald-500 to-emerald-700">
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={ad.title ?? ""} className="w-full h-full object-cover" />
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
                <h2 className="text-lg font-bold text-slate-900 truncate">{ad.title ?? "Advertisement"}</h2>
                <div className="text-xs text-slate-400 font-mono">#{ad.id}</div>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${tone}`}>{ad.status}</span>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <KV label="Created by" value={ad.restaurant_name ?? (ad.restaurant_id ? `Restaurant #${ad.restaurant_id}` : "Admin")} />
                  <KV label="Type" value={(ad.add_type ?? "—").replace(/_/g, " ")} />
                  <KV label="Runs from" value={fmtDate(ad.start_date)} />
                  <KV label="Runs until" value={fmtDate(ad.end_date)} />
                  <KV label="Priority" value={ad.priority ?? "—"} />
                  <KV label="Payment" value={ad.is_paid ? `Paid · ₹${Number(ad.amount ?? 0).toLocaleString("en-IN")}` : "Unpaid (free)"} />
                </div>
              </section>

              {ad.description ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{ad.description}</p>
                </section>
              ) : null}

              {ad.image_full_url ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Advertisement image</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.image_full_url} alt="advertisement" className="rounded-lg border border-slate-200 max-h-56 object-contain" />
                </section>
              ) : null}
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
