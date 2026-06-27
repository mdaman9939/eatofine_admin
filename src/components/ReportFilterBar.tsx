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
  showOrderType = false,
  showCategory = false,
  showStatus = false,
}: {
  zones?: Option[];
  restaurants?: Option[];
  showZone?: boolean;
  showRestaurant?: boolean;
  showOrderType?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
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
  const orderType = params.get("order_type") ?? "";
  const category = params.get("category") ?? "";
  const orderStatus = params.get("order_status") ?? "";

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

      {showOrderType && (
        <label className="block">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Order Type</div>
          <select value={orderType} onChange={(e) => setParam({ order_type: e.target.value })} className={cls}>
            <option value="">All order types</option>
            <option value="delivery">Home Delivery</option>
            <option value="take_away">Take Away</option>
            <option value="dine_in">Dine In</option>
          </select>
        </label>
      )}
      {showCategory && (
        <label className="block">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Category Type</div>
          <select value={category} onChange={(e) => setParam({ category: e.target.value })} className={cls}>
            <option value="">All orders</option>
            <option value="campaign">Campaign orders</option>
          </select>
        </label>
      )}
      {showStatus && (
        <label className="block">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Order Status</div>
          <select value={orderStatus} onChange={(e) => setParam({ order_status: e.target.value })} className={cls}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="accepted">Accepted</option>
            <option value="processing">Processing</option>
            <option value="handover">Handover</option>
            <option value="picked_up">Picked up</option>
            <option value="delivered">Delivered</option>
            <option value="canceled">Canceled</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </label>
      )}

      {(days || from || to || zone || restaurant || orderType || category || orderStatus) && (
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
