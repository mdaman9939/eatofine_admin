import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { ActionButton } from "../../../../components/ActionButton";
import { RestaurantDetailTabs, type RestaurantTabData } from "../../../../components/RestaurantDetailTabs";

interface RestaurantDetail {
  restaurant: {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
    status: boolean;
    active: boolean;
    delivery: boolean;
    take_away: boolean;
    veg: boolean;
    non_veg: boolean;
    free_delivery: boolean;
    schedule_order: boolean;
    pos_system: boolean;
    self_delivery_system: boolean;
    cutlery: boolean;
    food_section: boolean;
    reviews_section: boolean;
    minimum_order: number;
    comission: number | null;
    tax: number;
    minimum_shipping_charge: number;
    delivery_time: string | null;
    restaurant_model: string | null;
    zone_id: number | null;
    vendor_id: number;
    latitude: string | null;
    longitude: string | null;
    logo: string | null;
    cover_photo: string | null;
    opening_time: string | null;
    closeing_time: string | null;
  };
  vendor: { id: number; f_name: string | null; l_name: string | null; email: string | null; phone: string | null } | null;
  stats: { food_count: number; order_count: number; revenue: number };
}

const STORAGE_BASE = "http://192.168.0.159:3000/storage/restaurant/";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, tabs] = await Promise.all([
    adminFetch<RestaurantDetail>(`/admin/restaurants/${id}`),
    adminFetch<RestaurantTabData>(`/admin/restaurants/${id}/tabs`).catch(() => null),
  ]);
  const r = data.restaurant;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/dashboard/restaurants" className="text-sm text-orange-600 hover:underline">
        ← All restaurants
      </Link>
      <div className="mt-2 flex items-start gap-4">
        {r.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${STORAGE_BASE}${r.logo}`} alt={r.name} className="w-16 h-16 rounded-lg object-cover bg-zinc-100" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-zinc-200" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{r.name}</h1>
          <p className="text-sm text-zinc-500">
            #{r.id} · {r.restaurant_model ?? "—"} · Zone {r.zone_id ?? "—"}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href={`/dashboard/restaurants/${r.id}/edit`}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 self-start"
          >
            Edit
          </Link>
          <ActionButton
            path={`/restaurants/${r.id}`}
            method="PATCH"
            body={{ status: !r.status }}
            label={r.status ? "Disable" : "Enable"}
            variant={r.status ? "subtle" : "primary"}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Food items" value={data.stats.food_count} />
        <Stat label="Orders" value={data.stats.order_count} />
        <Stat label="Paid revenue" value={`₹${data.stats.revenue.toLocaleString("en-IN")}`} />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Contact">
          <KV label="Email" value={r.email} />
          <KV label="Phone" value={r.phone} />
          <KV label="Address" value={r.address} />
          <KV label="Lat / Lon" value={r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : null} />
          <KV label="Opening hours" value={r.opening_time && r.closeing_time ? `${r.opening_time} – ${r.closeing_time}` : null} />
          <KV label="Delivery time" value={r.delivery_time} />
        </Card>

        <Card title="Vendor">
          {data.vendor ? (
            <>
              <KV
                label="Name"
                value={`${data.vendor.f_name ?? ""} ${data.vendor.l_name ?? ""}`.trim() || null}
              />
              <KV label="Email" value={data.vendor.email} />
              <KV label="Phone" value={data.vendor.phone} />
            </>
          ) : (
            <p className="text-sm text-zinc-500">—</p>
          )}
        </Card>

        <Card title="Commerce">
          <KV label="Commission" value={r.comission !== null ? `${r.comission}%` : null} />
          <KV label="Minimum order" value={`₹${r.minimum_order.toFixed(2)}`} />
          <KV label="Min. shipping charge" value={`₹${r.minimum_shipping_charge.toFixed(2)}`} />
          <KV label="Tax" value={`${r.tax}%`} />
        </Card>

        <Card title="Capabilities">
          <Flag label="Delivery" value={r.delivery} />
          <Flag label="Take-away" value={r.take_away} />
          <Flag label="Schedule order" value={r.schedule_order} />
          <Flag label="Free delivery" value={r.free_delivery} />
          <Flag label="POS" value={r.pos_system} />
          <Flag label="Self-delivery" value={r.self_delivery_system} />
          <Flag label="Veg" value={r.veg} />
          <Flag label="Non-veg" value={r.non_veg} />
          <Flag label="Cutlery option" value={r.cutlery} />
        </Card>
      </div>

      {tabs && (
        <div className="mt-6">
          <RestaurantDetailTabs data={tabs} />
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">{title}</h2>
      <dl className="text-sm space-y-1">{children}</dl>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-800 dark:text-zinc-100 text-right">{value ?? "—"}</dd>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={value ? "text-emerald-600" : "text-zinc-400"}>{value ? "✓" : "—"}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
