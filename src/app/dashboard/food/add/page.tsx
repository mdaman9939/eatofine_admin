import { adminFetch } from "../../../../lib/api";
import { CreateForm, type FieldSpec } from "../../../../components/CreateForm";

interface Restaurant { id: number; name: string }
interface Category { id: number; name: string }
interface Addon { id: number; name: string }

export default async function AddFoodPage() {
  const [restaurants, categories, addons] = await Promise.all([
    adminFetch<{ restaurants?: Restaurant[]; items?: Restaurant[] }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Restaurant[]; items?: Restaurant[] })),
    adminFetch<{ items?: Category[]; categories?: Category[] }>("/admin/categories?limit=200").catch(() => ({} as { items?: Category[]; categories?: Category[] })),
    adminFetch<{ items?: Addon[]; add_ons?: Addon[] }>("/admin/add-ons?limit=200").catch(() => ({} as { items?: Addon[]; add_ons?: Addon[] })),
  ]);
  const restList: Restaurant[] = restaurants.restaurants ?? restaurants.items ?? [];
  const catList: Category[] = categories.items ?? categories.categories ?? [];
  const addonList: Addon[] = addons.items ?? addons.add_ons ?? [];

  const fields: FieldSpec[] = buildFoodFields(restList, catList, addonList);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> FOOD MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Food</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Full food editor — image, pricing, discount type, stock, availability window, add-ons and SEO, just like
            the Laravel admin. Becomes immediately orderable in the customer app.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/food"
          title="New food item"
          submitLabel="Create food"
          embedded
          redirectTo="/dashboard/food"
          fields={fields}
        />
      </div>
    </div>
  );
}

/** Shared field list — reused by the edit page so add/edit never drift. */
export function buildFoodFields(
  restaurants: Restaurant[],
  categories: Category[],
  addons: Addon[],
): FieldSpec[] {
  return [
    { name: "name", label: "Food name (default)", type: "text", required: true, placeholder: "e.g. Margherita Pizza" },
    { name: "translations", label: "Name in other languages", type: "multilang", langKey: "name" },
    { name: "description", label: "Description (default)", type: "textarea", placeholder: "Tomato sauce, mozzarella, basil" },
    { name: "description_translations", label: "Description in other languages", type: "multilang", langKey: "description" },
    { name: "image", label: "Food image", type: "image", imageDir: "product" },
    { name: "restaurant_id", label: "Restaurant", type: "select", required: true, options: restaurants.map((r) => ({ value: String(r.id), label: r.name })) },
    { name: "category_id", label: "Category", type: "select", options: categories.map((c) => ({ value: String(c.id), label: c.name })) },

    { name: "price", label: "Price ₹", type: "number", required: true, defaultValue: 200 },
    { name: "discount", label: "Discount", type: "number", defaultValue: 0 },
    { name: "discount_type", label: "Discount type", type: "select", defaultValue: "percent", options: [
      { value: "percent", label: "Percent (%)" },
      { value: "amount", label: "Amount (₹)" },
    ] },
    { name: "tax", label: "Tax %", type: "number", defaultValue: 5 },

    { name: "stock_type", label: "Stock type", type: "select", defaultValue: "unlimited", options: [
      { value: "unlimited", label: "Unlimited" },
      { value: "daily", label: "Daily" },
      { value: "fixed", label: "Fixed" },
    ] },
    { name: "item_stock", label: "Item stock", type: "number", defaultValue: 0 },
    { name: "maximum_cart_quantity", label: "Max order qty", type: "number", placeholder: "blank = no limit" },

    { name: "available_time_starts", label: "Available from", type: "text", defaultValue: "00:00", placeholder: "HH:MM" },
    { name: "available_time_ends", label: "Available until", type: "text", defaultValue: "23:59", placeholder: "HH:MM" },

    { name: "addon_ids", label: "Add-ons", type: "multiselect", options: addons.map((a) => ({ value: String(a.id), label: a.name })) },

    // Variations — Half / Full / Small / Medium / Large with per-option prices.
    { name: "variations", label: "Food variations", type: "variations" },

    // Veg / Non-veg (explicit option, like StackFood).
    { name: "veg", label: "Food type", type: "select", defaultValue: "1", options: [
      { value: "1", label: "Veg" },
      { value: "0", label: "Non-veg" },
    ] },
    { name: "is_halal", label: "Halal", type: "checkbox", defaultValue: false },
    { name: "recommended", label: "Recommended", type: "checkbox", defaultValue: false },

    { name: "meta_title", label: "SEO meta title", type: "text", placeholder: "Optional" },
    { name: "meta_description", label: "SEO meta description", type: "textarea", placeholder: "Optional" },
  ];
}
