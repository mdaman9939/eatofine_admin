import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, ActionButton, DeleteButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface Food {
  id: number;
  name: string | null;
  image: string | null;
  price: number;
  discount: number;
  discount_type: string;
  veg: boolean;
  status: boolean;
  recommended: boolean;
  restaurant_id: number;
  restaurant: { id?: number; name?: string | null } | null;
  avg_rating: number;
  order_count: number;
  item_stock: number;
  stock_type: string;
}

interface FoodResponse {
  total: number;
  food: Food[];
}

const STORAGE_BASE = "http://192.168.0.159:3000/storage/product/";

export default async function FoodPage() {
  const data = await adminFetch<FoodResponse>("/admin/food?limit=500");
  const foods = data.food;
  const activeCount = foods.filter((f) => f.status).length;
  const vegCount = foods.filter((f) => f.veg).length;
  const nonVegCount = foods.length - vegCount;
  const recommendedCount = foods.filter((f) => f.recommended).length;
  const totalOrders = foods.reduce((s, f) => s + (f.order_count || 0), 0);
  const avgPrice = foods.length > 0 ? foods.reduce((s, f) => s + (f.price || 0), 0) / foods.length : 0;

  const slices = [
    { label: "Vegetarian", value: vegCount, color: DONUT_PALETTE.emerald },
    { label: "Non-veg", value: nonVegCount, color: DONUT_PALETTE.rose },
  ];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Food management · Catalogue
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Food items</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Every dish on every menu, across every restaurant. Disabling an item hides it from
              customer apps; recommending it surfaces it in featured rails.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Catalogue</div>
            <div className="text-lg font-bold tabular-nums">{data.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{recommendedCount} recommended · {activeCount} active</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total items" value={data.total.toLocaleString("en-IN")} suffix={`Showing ${foods.length}`} accent="emerald" />
        <StatCard label="Active" value={activeCount.toString()} suffix={foods.length > 0 ? `${Math.round((activeCount / foods.length) * 100)}% live` : "—"} accent="teal" />
        <StatCard label="Avg price" value={avgPrice > 0 ? `₹${avgPrice.toFixed(0)}` : "—"} suffix={`${recommendedCount} recommended`} accent="emerald" />
        <StatCard label="Total orders" value={totalOrders.toLocaleString("en-IN")} suffix="across catalogue" accent="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Veg vs non-veg</h3>
          <p className="text-xs text-slate-500 mt-0.5">Dietary mix across the catalogue.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Items" centerValue={foods.length} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>
        </div>

        <PaginatedTable
          headerRow={
            <tr>
              <th className="px-6 py-3 font-semibold">Item</th>
              <th className="px-6 py-3 font-semibold">Restaurant</th>
              <th className="px-6 py-3 font-semibold text-right">Price</th>
              <th className="px-6 py-3 font-semibold">Veg</th>
              <th className="px-6 py-3 font-semibold text-right">Orders</th>
              <th className="px-6 py-3 font-semibold text-right">Stock</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          }
          bodyRows={foods.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${STORAGE_BASE}${f.image}`} alt={f.name ?? ""} className="w-11 h-11 rounded-lg object-cover ring-1 ring-slate-200" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center text-xs font-bold">
                      {(f.name ?? "F").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link href={`/dashboard/food/${f.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors block truncate">
                      {f.name ?? "—"}
                    </Link>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="inline-flex items-center gap-0.5">
                        <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {f.avg_rating.toFixed(1)}
                      </span>
                      {f.recommended && (
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">★ Featured</span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3">
                <span className="text-slate-700 text-xs truncate block max-w-[160px]">{f.restaurant?.name ?? `#${f.restaurant_id}`}</span>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="text-right">
                  <div className="font-semibold text-slate-900 tabular-nums">₹{f.price.toFixed(2)}</div>
                  {f.discount > 0 && (
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      -{f.discount}{f.discount_type === "percent" ? "%" : "₹"}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-3">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    f.veg ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-sm border ${f.veg ? "border-emerald-600" : "border-rose-600"}`}>
                    <span className={`block w-1 h-1 m-0.5 rounded-full ${f.veg ? "bg-emerald-600" : "bg-rose-600"}`} />
                  </span>
                  {f.veg ? "Veg" : "Non-veg"}
                </span>
              </td>
              <td className="px-6 py-3 text-right">
                <span className="tabular-nums font-semibold text-slate-900">{f.order_count.toLocaleString("en-IN")}</span>
              </td>
              <td className="px-6 py-3 text-right">
                <span className="text-xs text-slate-500 tabular-nums">{f.stock_type === "unlimited" ? "∞" : f.item_stock}</span>
              </td>
              <td className="px-6 py-3">
                {f.status ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Off
                  </span>
                )}
              </td>
              <td className="px-6 py-3 text-right">
                <div className="inline-flex gap-1.5 flex-wrap justify-end">
                  <Link
                    href={`/dashboard/food/${f.id}/edit`}
                    className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200"
                  >
                    Edit
                  </Link>
                  <ToggleStatusButton basePath="/food" id={f.id} currentStatus={f.status} />
                  <ActionButton path={`/food/${f.id}/recommended`} method="PATCH" body={{ recommended: !f.recommended }} label={f.recommended ? "Unmark" : "Recommend"} variant="subtle" />
                  <DeleteButton basePath="/food" id={f.id} />
                </div>
              </td>
            </tr>
          ))}
          searchTexts={foods.map((f) => `${f.name ?? ""} ${f.restaurant?.name ?? ""}`.toLowerCase())}
          pageSize={10}
          searchable
          colCount={8}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent: "emerald" | "teal" }) {
  const palette: Record<string, { bg: string }> = {
    emerald: { bg: "from-emerald-50/60 to-white" },
    teal: { bg: "from-teal-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
