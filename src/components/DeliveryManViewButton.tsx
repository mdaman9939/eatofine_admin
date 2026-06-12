"use client";

import { useState } from "react";

interface DeliveryManDetail {
  delivery_man: {
    id: number;
    f_name?: string | null;
    l_name?: string | null;
    email?: string | null;
    phone?: string | null;
    image_full_url?: string | null;
    application_status?: string | null;
    rejection_reason?: string | null;
    status?: boolean;
    zone_id?: number | null;
    vehicle_id?: number | null;
    shift_id?: number | null;
    type?: string | null;
    age?: number | null;
    dob?: string | null;
    identity_type?: string | null;
    identity_number?: string | null;
    license_image_full_url?: string | null;
    identity_image_full_urls?: string[];
  };
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
      <div className="text-sm text-slate-800 mt-0.5 break-words">{value ?? "—"}</div>
    </div>
  );
}

function DocThumb({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group block">
      <div className="w-28 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group-hover:ring-2 group-hover:ring-blue-300 transition">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="w-full h-full object-cover" />
      </div>
      <div className="mt-1 text-[11px] text-slate-500 text-center">{label}</div>
    </a>
  );
}

export function DeliveryManViewButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<DeliveryManDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setOpen(true);
    if (data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/delivery-men/${id}`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setData((await res.json()) as DeliveryManDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  }

  const d = data?.delivery_man;
  const name = d ? `${d.f_name ?? ""} ${d.l_name ?? ""}`.trim() || "—" : "—";
  const appStatus = (d?.application_status ?? "").toLowerCase();
  const isDenied = appStatus === "denied" || appStatus === "rejected";

  return (
    <>
      <button
        onClick={load}
        title="View profile"
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with avatar */}
            <div className="relative">
              <div className="h-24 bg-gradient-to-br from-slate-600 to-slate-800" />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:bg-white flex items-center justify-center shadow"
              >
                ✕
              </button>
              <div className="absolute left-6 -bottom-8">
                <div className="w-16 h-16 rounded-2xl ring-4 ring-white bg-slate-100 overflow-hidden shadow">
                  {d?.image_full_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_full_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🛵</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pt-10 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{name}</h2>
                <div className="text-xs text-slate-400 font-mono">#{id}</div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  isDenied
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isDenied ? "Denied" : d?.application_status ?? "—"}
              </span>
            </div>

            <div className="overflow-y-auto px-6 py-4 space-y-6">
              {loading && <div className="py-10 text-center text-slate-400 text-sm">Loading profile…</div>}
              {error && <div className="py-10 text-center text-rose-500 text-sm">{error}</div>}

              {d && !loading && (
                <>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Email" value={d.email ?? "—"} />
                      <KV label="Phone" value={d.phone ?? "—"} />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Job details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Job type" value={d.type ?? "—"} />
                      <KV label="Zone" value={d.zone_id != null ? `#${d.zone_id}` : "—"} />
                      <KV label="Vehicle" value={d.vehicle_id != null ? `#${d.vehicle_id}` : "—"} />
                      <KV label="Shift" value={d.shift_id != null ? `#${d.shift_id}` : "—"} />
                      <KV label="Age" value={d.age ?? "—"} />
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Identity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <KV label="Identity type" value={d.identity_type ?? "—"} />
                      <KV label="Identity number" value={d.identity_number ?? "—"} />
                    </div>
                  </section>

                  {/* Submitted documents — what the joining request is verified against */}
                  {(d.license_image_full_url || (d.identity_image_full_urls?.length ?? 0) > 0) && (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Submitted documents</h3>
                      <div className="flex flex-wrap gap-3">
                        {(d.identity_image_full_urls ?? []).map((url, i) => (
                          <DocThumb key={`id-${i}`} url={url} label={`ID ${i + 1}`} />
                        ))}
                        {d.license_image_full_url ? (
                          <DocThumb url={d.license_image_full_url} label="Licence" />
                        ) : null}
                      </div>
                    </section>
                  )}

                  {isDenied && d.rejection_reason ? (
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Denial reason</h3>
                      <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                        {d.rejection_reason}
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
