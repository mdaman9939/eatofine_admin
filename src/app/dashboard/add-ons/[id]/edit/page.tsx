import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

interface AddOn {
  id: number;
  name: string | null;
  price: number;
  addon_category_id: number | null;
  stock_type: string;
  addon_stock: number;
}
interface AddonCategory { id: number; name: string | null }

export default async function EditAddonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [list, cats] = await Promise.all([
    adminFetch<{ items: AddOn[] }>("/admin/add-ons?limit=500"),
    adminFetch<{ items?: AddonCategory[] }>("/admin/addon-categories?limit=200").catch(() => ({} as { items?: AddonCategory[] })),
  ]);
  const a = list.items.find((x) => String(x.id) === id);
  if (!a) notFound();
  const catOptions = (cats.items ?? []).map((c) => ({ value: String(c.id), label: c.name ?? `#${c.id}` }));

  return (
    <div className="p-8 max-w-2xl space-y-5">
      <div>
        <Link href="/dashboard/add-ons" className="text-sm text-emerald-700 hover:underline">← All add-ons</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit add-on — {a.name}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/add-ons/${a.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/add-ons"
          initialValues={{
            name: a.name,
            price: a.price,
            addon_category_id: a.addon_category_id ?? "",
            stock_type: a.stock_type ?? "unlimited",
            addon_stock: a.addon_stock ?? 0,
          }}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "price", label: "Price ₹", type: "number", required: true },
            { name: "addon_category_id", label: "Addon category", type: "select", options: catOptions },
            { name: "stock_type", label: "Stock type", type: "select", options: [
              { value: "unlimited", label: "Unlimited" },
              { value: "limited", label: "Limited" },
              { value: "daily", label: "Daily" },
            ] },
            { name: "addon_stock", label: "Stock", type: "number" },
          ]}
        />
      </div>
    </div>
  );
}
