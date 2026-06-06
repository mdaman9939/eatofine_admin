"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Option { value: string; label: string }

/**
 * Report filter bar — date range (preset days or custom from/to) plus optional
 * zone and restaurant filters. Pushes the selection into URL search params so
 * the (server) report page re-fetches with the filter applied. Mirrors the
 * Laravel report filters (date range + zone + restaurant).
 */
export function ReportFilterBar({
  zones = [],
  restaurants = [],
  showZone = false,
  showRestaurant = false,
}: {
  zones?: Option[];
  restaurants?: Option[];
  showZone?: boolean;
  showRestaurant?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const days = params.get("days") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const zone = params.get("zone_id") ?? "";
  const restaurant = params.get("restaurant_id") ?? "";

  const presets = [
    { label: "7d", value: "7" },
    { label: "30d", value: "30" },
    { label: "90d", value: "90" },
    { label: "1y", value: "365" },
  ];

  const cls = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Period</div>
        <div className="flex gap-1">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setParam({ days: p.value, from: "", to: "" })}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${days === p.value && !from ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">From</div>
        <input type="date" value={from} onChange={(e) => setParam({ from: e.target.value, days: "" })} className={cls} />
      </label>
      <label className="block">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">To</div>
        <input type="date" value={to} onChange={(e) => setParam({ to: e.target.value, days: "" })} className={cls} />
      </label>

      {showZone && (
        <label className="block">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Zone</div>
          <select value={zone} onChange={(e) => setParam({ zone_id: e.target.value })} className={cls}>
            <option value="">All zones</option>
            {zones.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
        </label>
      )}
      {showRestaurant && (
        <label className="block">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Restaurant</div>
          <select value={restaurant} onChange={(e) => setParam({ restaurant_id: e.target.value })} className={cls}>
            <option value="">All restaurants</option>
            {restaurants.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
      )}

      {(days || from || to || zone || restaurant) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="ml-auto text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}
