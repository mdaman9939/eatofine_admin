import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { PosTerminal, type PosFood, type PosCategory } from "../../../../components/PosTerminal";

interface RestaurantDetail {
  restaurant: { id: number; name: string | null; tax: number };
}
interface FoodRow { id: number; name: string | null; price: number; category_id: number | null; veg?: boolean | null }

export default async function PosTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, foodsRes, catsRes] = await Promise.all([
    adminFetch<RestaurantDetail>(`/admin/restaurants/${id}`),
    adminFetch<{ items?: FoodRow[]; food?: FoodRow[] }>(`/admin/food?restaurant_id=${id}&limit=500`).catch(() => ({} as { items?: FoodRow[]; food?: FoodRow[] })),
    adminFetch<{ items?: PosCategory[]; categories?: PosCategory[] }>("/admin/categories?limit=200").catch(() => ({} as { items?: PosCategory[]; categories?: PosCategory[] })),
  ]);
  const r = detail.restaurant;
  const foods: PosFood[] = (foodsRes.items ?? foodsRes.food ?? []).map((f) => ({
    id: f.id, name: f.name, price: Number(f.price), category_id: f.category_id != null ? Number(f.category_id) : null, veg: f.veg,
  }));
  const categories: PosCategory[] = catsRes.items ?? catsRes.categories ?? [];
  // Only show categories that actually have items in this restaurant's menu.
  const usedCatIds = new Set(foods.map((f) => f.category_id).filter(Boolean));
  const menuCategories = categories.filter((c) => usedCatIds.has(c.id));

  return (
    <div className="relative p-8 space-y-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/pos" className="text-sm text-emerald-700 hover:underline">← POS · pick restaurant</Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">POS — {r.name}</h1>
          <p className="text-sm text-slate-500">{foods.length} menu items · tax {r.tax}%</p>
        </div>
      </div>

      <PosTerminal
        restaurantId={r.id}
        restaurantName={r.name ?? `#${r.id}`}
        restaurantTax={Number(r.tax ?? 0)}
        foods={foods}
        categories={menuCategories}
      />
    </div>
  );
}
