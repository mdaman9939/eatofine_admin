import { adminFetch } from "../../../../lib/api";
import { CreateForm } from "../../../../components/CreateForm";

interface Restaurant { id: number; name: string }
interface Category { id: number; name: string }

export default async function AddFoodPage() {
  const restaurants = await adminFetch<{ restaurants?: Restaurant[]; items?: Restaurant[] }>(
    "/admin/restaurants?limit=100",
  ).catch(() => ({ restaurants: [] as Restaurant[], items: [] as Restaurant[] }));
  const categories = await adminFetch<{ items?: Category[]; categories?: Category[] }>(
    "/admin/categories?limit=100",
  ).catch(() => ({ items: [] as Category[], categories: [] as Category[] }));
  const restList: Restaurant[] = restaurants.restaurants ?? restaurants.items ?? [];
  const catList: Category[] = categories.items ?? categories.categories ?? [];

  return (
    <div className="relative p-8 space-y-6 max-w-3xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> FOOD MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Food</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Add a food item to an existing restaurant&apos;s menu. Becomes immediately orderable in the customer app.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/food"
          title="New food item"
          submitLabel="Create food"
          fields={[
            { name: "name", label: "Food name", type: "text", required: true, placeholder: "e.g. Margherita Pizza" },
            { name: "description", label: "Description", type: "textarea", placeholder: "Tomato sauce, mozzarella, basil" },
            { name: "price", label: "Price ₹", type: "number", required: true, defaultValue: 200 },
            { name: "restaurant_id", label: "Restaurant", type: "select", required: true, options: restList.map((r) => ({ value: String(r.id), label: r.name })) },
            { name: "category_id", label: "Category", type: "select", options: catList.map((c) => ({ value: String(c.id), label: c.name })) },
            { name: "tax", label: "Tax %", type: "number", defaultValue: 5 },
            { name: "discount", label: "Discount %", type: "number", defaultValue: 0 },
            { name: "veg", label: "Vegetarian", type: "checkbox", defaultValue: true },
          ]}
        />
      </div>
    </div>
  );
}
