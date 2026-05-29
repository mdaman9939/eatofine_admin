import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { ToggleStatusButton, ActionButton } from "../../../../components/ActionButton";

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
    status: boolean;
    recommended: boolean;
    restaurant_id: number;
    category_id: number | null;
    order_count: number;
    avg_rating: number;
    rating_count: number;
    item_stock: number;
    sell_count: number;
    stock_type: string;
    available_time_starts: string | null;
    available_time_ends: string | null;
    variations: unknown;
    add_ons: unknown;
  };
  restaurant: { id: number; name: string } | null;
}

const STORAGE_BASE = "http://192.168.0.159:3000/storage/product/";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await adminFetch<FoodDetail>(`/admin/food/${id}`);
  const f = data.food;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/dashboard/food" className="text-sm text-orange-600 hover:underline">
        ← All food
      </Link>
      <div className="mt-2 flex items-start gap-4">
        {f.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${STORAGE_BASE}${f.image}`} alt={f.name ?? ""} className="w-24 h-24 rounded-lg object-cover bg-zinc-100" />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-zinc-200" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{f.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            #{f.id} · {data.restaurant ? (
              <Link href={`/dashboard/restaurants/${data.restaurant.id}`} className="text-orange-600 hover:underline">
                {data.restaurant.name}
              </Link>
            ) : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <ToggleStatusButton basePath="/food" id={f.id} currentStatus={f.status} />
          <ActionButton
            path={`/food/${f.id}/recommended`}
            method="PATCH"
            body={{ recommended: !f.recommended }}
            label={f.recommended ? "Unmark" : "Recommend"}
            variant="subtle"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Price" value={`₹${f.price.toFixed(2)}`} />
        <Stat label="Orders placed" value={f.order_count} />
        <Stat label={`Rating (${f.rating_count})`} value={`★ ${f.avg_rating.toFixed(1)}`} />
      </div>

      {f.description && (
        <div className="mt-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-2">Description</h2>
          <p className="text-sm whitespace-pre-line">{f.description}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-3">Pricing</h2>
          <KV label="Price" value={`₹${f.price.toFixed(2)}`} />
          <KV label="Tax" value={`${f.tax}%`} />
          <KV label="Discount" value={f.discount ? `${f.discount}${f.discount_type === "percent" ? "%" : "₹"}` : "—"} />
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-3">Inventory</h2>
          <KV label="Stock type" value={f.stock_type} />
          {f.stock_type !== "unlimited" && <KV label="Stock" value={String(f.item_stock)} />}
          <KV label="Total sold" value={String(f.sell_count)} />
          <KV label="Veg" value={f.veg ? "yes" : "no"} />
          <KV label="Halal" value={f.is_halal ? "yes" : "no"} />
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-zinc-500">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
