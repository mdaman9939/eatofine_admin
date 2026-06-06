import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import { buildFoodFields } from "../../add/page";

interface Restaurant { id: number; name: string }
interface Category { id: number; name: string }
interface Addon { id: number; name: string }

interface FoodDetail {
  food: {
    id: number;
    name: string | null;
    description: string | null;
    image: string | null;
    price: number;
    tax: number;
    discount: number;
    discount_type: string;
    veg: boolean;
    is_halal: boolean;
    recommended: boolean;
    restaurant_id: number;
    category_id: number | null;
    item_stock: number;
    stock_type: string;
    maximum_cart_quantity?: number | null;
    available_time_starts: string | null;
    available_time_ends: string | null;
    add_ons?: number[] | null;
    addon_ids?: number[] | null;
    meta_title?: string | null;
    meta_description?: string | null;
  };
}

export default async function EditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, restaurants, categories, addons] = await Promise.all([
    adminFetch<FoodDetail>(`/admin/food/${id}`),
    adminFetch<{ restaurants?: Restaurant[]; items?: Restaurant[] }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Restaurant[]; items?: Restaurant[] })),
    adminFetch<{ items?: Category[]; categories?: Category[] }>("/admin/categories?limit=200").catch(() => ({} as { items?: Category[]; categories?: Category[] })),
    adminFetch<{ items?: Addon[]; add_ons?: Addon[] }>("/admin/add-ons?limit=200").catch(() => ({} as { items?: Addon[]; add_ons?: Addon[] })),
  ]);
  const f = data.food;
  const restList: Restaurant[] = restaurants.restaurants ?? restaurants.items ?? [];
  const catList: Category[] = categories.items ?? categories.categories ?? [];
  const addonList: Addon[] = addons.items ?? addons.add_ons ?? [];
  const selectedAddons = (f.add_ons ?? f.addon_ids ?? []).map(Number);

  return (
    <div className="relative p-8 space-y-6 max-w-3xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> FOOD MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Food</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Update <span className="font-semibold">{f.name ?? `#${f.id}`}</span> — changes apply immediately in the customer app.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/dashboard/food/${f.id}`} className="text-sm text-emerald-700 hover:underline">← Back to food</Link>
        <span className="text-xs text-slate-400 font-mono">#{f.id}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/food/${f.id}`}
          submitLabel="Save changes"
          redirectTo={`/dashboard/food/${f.id}`}
          fields={buildFoodFields(restList, catList, addonList)}
          initialValues={{
            name: f.name,
            description: f.description,
            image: f.image,
            restaurant_id: f.restaurant_id,
            category_id: f.category_id,
            price: f.price,
            discount: f.discount,
            discount_type: f.discount_type,
            tax: f.tax,
            stock_type: f.stock_type,
            item_stock: f.item_stock,
            maximum_cart_quantity: f.maximum_cart_quantity ?? "",
            available_time_starts: f.available_time_starts,
            available_time_ends: f.available_time_ends,
            addon_ids: selectedAddons,
            veg: f.veg,
            is_halal: f.is_halal,
            recommended: f.recommended,
            meta_title: f.meta_title ?? "",
            meta_description: f.meta_description ?? "",
          }}
        />
      </div>
    </div>
  );
}
