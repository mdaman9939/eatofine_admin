"use client";

import { useState } from "react";

interface RestaurantDetail {
  restaurant: {
    id: number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    status?: boolean;
    active?: boolean;
    logo_full_url?: string | null;
    cover_photo_full_url?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    zone_id?: number | null;
    comission?: number | null;
    minimum_order?: number;
    tax?: number;
    minimum_shipping_charge?: number;
    delivery_time?: string | null;
    restaurant_model?: string | null;
    delivery?: boolean;
    take_away?: boolean;
    veg?: boolean;
    non_veg?: boolean;
    free_delivery?: boolean;
    schedule_order?: boolean;
    pos_system?: boolean;
    self_delivery_system?: boolean;
    cutlery?: boolean;
    identity_number?: string | null;
    state?: string | null;
    created_at?: string | null;
  };
  vendor: { id: number; f_name: string | null; l_name: string | null; email: string | null; phone: string | null } | null;
  stats?: { food_count: number; order_count: number; revenue: number };
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{value ?? "—"}</div>
    </div>
  );
}

function Flag({ label, on }: { label: string; on?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${on ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-slate-300"}`} />
      {label}
    </span>
  );
}

export function RestaurantViewButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setData((await res.json()) as RestaurantDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  }

  const r = data?.restaurant;
  const v = data?.vendor;
  const inr = (n?: number | null) => `₹${Math.round(Number(n ?? 0)).toLocaleString("en-IN")}`;
  const ownerName = v ? `${v.f_name ?? ""} ${v.l_name ?? ""}`.trim() || "—" : "—";

  return (
    <>
      <button
        onClick={load}
        title="View details"
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover + logo header */}
            <div className="relative">
              <div className="h-28 bg-gradient-to-br from-emerald-500 to-emerald-700">
                {r?.cover_photo_full_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover_photo_full_url} alt="cover" className="w-full h-full object-cover" />
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:bg-white flex items-center justify-center shadow"
              >
                ✕
              </button>
              <div className="absolute left-6 -bottom-8 flex items-end gap-3">
                <div className="w-16 h-16 rounded-2xl ring-4 ring-white bg-slate-100 overflow-hidden shadow">
                  {r?.logo_full_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.logo_full_url} alt={r?.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🍽️</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pt-10 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{r?.name ?? "Restaurant"}</h2>
                <div className="text-xs text-slate-400 font-mono">#{id}</div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Pending review
              </span>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-6">
              {loading && <div className="py-10 text-center text-slate-400 text-sm">Loading details…</div>}
              {error && <div className="py-10 text-center text-rose-500 text-sm">{error}</div>}

              {r && !loading && (
                <>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Owner</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Name" value={ownerName} />
                      <KV label="Owner email" value={v?.email ?? "—"} />
                      <KV label="Owner phone" value={v?.phone ?? "—"} />
                      <KV label="Vendor ID" value={v?.id ?? "—"} />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Contact &amp; location</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Email" value={r.email ?? "—"} />
                      <KV label="Phone" value={r.phone ?? "—"} />
                      <KV label="Address" value={r.address ?? "—"} />
                      <KV label="Zone" value={r.zone_id ?? "—"} />
                      <KV label="Latitude" value={r.latitude ?? "—"} />
                      <KV label="Longitude" value={r.longitude ?? "—"} />
                      {r.state ? <KV label="State" value={r.state} /> : null}
                      {r.identity_number ? <KV label="Identity no." value={r.identity_number} /> : null}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Business &amp; pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Model" value={r.restaurant_model ?? "—"} />
                      <KV label="Commission" value={r.comission != null ? `${r.comission}%` : "—"} />
                      <KV label="Min order" value={inr(r.minimum_order)} />
                      <KV label="Tax" value={`${r.tax ?? 0}%`} />
                      <KV label="Delivery fee" value={inr(r.minimum_shipping_charge)} />
                      <KV label="Delivery time" value={r.delivery_time ?? "—"} />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Capabilities</h3>
                    <div className="flex flex-wrap gap-2">
                      <Flag label="Delivery" on={r.delivery} />
                      <Flag label="Take away" on={r.take_away} />
                      <Flag label="Veg" on={r.veg} />
                      <Flag label="Non-veg" on={r.non_veg} />
                      <Flag label="Free delivery" on={r.free_delivery} />
                      <Flag label="Schedule order" on={r.schedule_order} />
                      <Flag label="POS" on={r.pos_system} />
                      <Flag label="Self delivery" on={r.self_delivery_system} />
                      <Flag label="Cutlery" on={r.cutlery} />
                    </div>
                  </section>
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
