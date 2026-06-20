import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { ActionButton } from "../../../../components/ActionButton";
import { RefundPanel } from "./RefundPanel";

interface OrderDetail {
  earnings?: {
    customer_payment: number;
    food_amount: number;
    commission_pct: number;
    eatofine_commission: number;
    eatofine_platform_fee: number;
    admin_discount: number;
    restaurant_discount: number;
    eatofine_earning: number;
    restaurant_earning: number;
    deliveryman_earning: number;
    tax_amount: number;
  };
  order: {
    id: number;
    order_amount: number;
    coupon_discount_amount: number;
    total_tax_amount: number;
    delivery_charge: number;
    restaurant_discount_amount: number;
    payment_status: string;
    order_status: string;
    payment_method: string | null;
    order_type: string;
    coupon_code: string | null;
    order_note: string | null;
    delivery_address: string | { address?: string | null; contact_person_name?: string | null; contact_person_number?: string | null } | null;
    cancellation_reason: string | null;
    canceled_by: string | null;
    timeline: Record<string, string | null>;
    created_at: string | null;
  };
  user: { id: number; f_name: string | null; l_name: string | null; email: string | null; phone: string | null } | null;
  restaurant: { id: number; name: string | null; phone: string | null; email: string | null; address: string | null } | null;
  delivery_man: { id: number; f_name: string | null; l_name: string | null; phone: string | null } | null;
  items: Array<{
    id: number;
    food_id: number | null;
    price: number;
    quantity: number;
    tax_amount: number;
    total_add_on_price: number;
    variant: string | null;
    food_details: unknown;
  }>;
}

const NEXT_STATUS: Record<string, string[]> = {
  pending: ["confirmed", "canceled"],
  confirmed: ["processing", "canceled"],
  accepted: ["processing", "canceled"],
  processing: ["handover", "canceled"],
  handover: ["picked_up", "canceled"],
  picked_up: ["delivered", "canceled"],
  delivered: [],
  canceled: [],
  failed: [],
};

const TIMELINE_KEYS = [
  "pending",
  "accepted",
  "confirmed",
  "processing",
  "handover",
  "picked_up",
  "delivered",
  "canceled",
  "failed",
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await adminFetch<OrderDetail>(`/admin/orders/${id}`);
  const o = data.order;
  const subtotal = o.order_amount - o.total_tax_amount - o.delivery_charge;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/dashboard/orders" className="text-sm text-orange-600 hover:underline">
        ← All orders
      </Link>
      <div className="mt-2 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Order #{o.id}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {o.created_at ? new Date(o.created_at).toLocaleString() : "—"} · {o.order_type} · {o.payment_method ?? "?"} (
            {o.payment_status})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* One-click jump to this order's customer GST invoice. */}
          <Link
            href={`/dashboard/invoices/${o.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-1.5 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View invoice
          </Link>
          <span className="inline-block rounded px-3 py-1 text-sm bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100">
            {o.order_status}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {(NEXT_STATUS[o.order_status] ?? []).map((s) => (
          <ActionButton
            key={s}
            path={`/orders/${o.id}/status`}
            method="PATCH"
            body={{ status: s }}
            label={`Mark ${s}`}
            variant={s === "canceled" ? "danger" : "primary"}
            confirm={s === "canceled" ? "Cancel this order?" : undefined}
          />
        ))}
        {/* Admin authority — cancel ANY order, even after delivery, when the
            normal flow no longer offers a cancel option. */}
        {o.order_status !== "canceled" && !(NEXT_STATUS[o.order_status] ?? []).includes("canceled") && (
          <ActionButton
            path={`/orders/${o.id}/status`}
            method="PATCH"
            body={{ status: "canceled", reason: "Cancelled by admin" }}
            label="Cancel order (admin)"
            variant="danger"
            confirm="Force-cancel this order as admin? This overrides the normal order flow."
          />
        )}
      </div>

      <RefundPanel orderId={o.id} orderStatus={o.order_status} />

      <RefundHistory orderId={o.id} />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Customer</h2>
          {data.user ? (
            <div className="text-sm space-y-1">
              {/* Walk-in / POS customers have id 0 (no account) — show as plain
                  text so we never link to a non-existent /users/0 page. */}
              {data.user.id ? (
                <Link href={`/dashboard/users/${data.user.id}`} className="text-orange-600 hover:underline">
                  {`${data.user.f_name ?? ""} ${data.user.l_name ?? ""}`.trim() || "—"}
                </Link>
              ) : (
                <div className="font-medium">
                  {`${data.user.f_name ?? ""} ${data.user.l_name ?? ""}`.trim() || "—"}
                  <span className="ml-1 text-xs text-zinc-400">(walk-in)</span>
                </div>
              )}
              <div>{data.user.email}</div>
              <div>{data.user.phone}</div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Guest order</p>
          )}
          {(() => {
            // delivery_address may be a plain string OR a structured object
            // ({ contact_person_name, contact_person_number, address }) — never
            // render the object directly (React error #31).
            const da = o.delivery_address;
            if (!da) return null;
            const name = typeof da === "object" ? da.contact_person_name : null;
            const phone = typeof da === "object" ? da.contact_person_number : null;
            const text = typeof da === "string" ? da : da.address ?? "";
            if (!text && !name) return null;
            return (
              <div className="mt-3">
                <h3 className="text-xs uppercase text-zinc-500 mb-1">Delivery address</h3>
                {name && <p className="text-sm font-medium">{name}{phone ? ` · ${phone}` : ""}</p>}
                {text && <p className="text-sm whitespace-pre-line text-zinc-600">{text}</p>}
              </div>
            );
          })()}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Restaurant</h2>
          {data.restaurant ? (
            <div className="text-sm space-y-1">
              <Link
                href={`/dashboard/restaurants/${data.restaurant.id}`}
                className="text-orange-600 hover:underline"
              >
                {data.restaurant.name}
              </Link>
              <div>{data.restaurant.phone}</div>
              <div>{data.restaurant.email}</div>
              <div className="text-zinc-500 text-xs">{data.restaurant.address}</div>
            </div>
          ) : (
            "—"
          )}
          <h3 className="text-xs uppercase text-zinc-500 mt-4 mb-1">Delivery man</h3>
          {data.delivery_man ? (
            <div className="text-sm">
              {`${data.delivery_man.f_name ?? ""} ${data.delivery_man.l_name ?? ""}`.trim()} ·{" "}
              {data.delivery_man.phone}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Not assigned</p>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2">Food</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2">GST</th>
              <th className="py-2">Add-ons</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {data.items.map((it) => {
              const total = it.price * it.quantity + it.total_add_on_price;
              const detail = it.food_details as { name?: string } | null;
              return (
                <tr key={it.id}>
                  <td className="py-2">
                    {detail?.name ?? `#${it.food_id ?? "—"}`}{" "}
                    {it.variant && <span className="text-xs text-zinc-500">({it.variant})</span>}
                  </td>
                  <td className="py-2">×{it.quantity}</td>
                  <td className="py-2">₹{it.price.toFixed(2)}</td>
                  <td className="py-2">₹{it.tax_amount.toFixed(2)}</td>
                  <td className="py-2">₹{it.total_add_on_price.toFixed(2)}</td>
                  <td className="py-2 text-right">₹{total.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Summary</h2>
          <dl className="text-sm space-y-1">
            <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
            {o.total_tax_amount > 0 && <Row label="GST" value={`₹${o.total_tax_amount.toFixed(2)}`} />}
            {o.delivery_charge > 0 && <Row label="Delivery" value={`₹${o.delivery_charge.toFixed(2)}`} />}
            {o.coupon_discount_amount > 0 && (
              <Row label={`Coupon (${o.coupon_code ?? "—"})`} value={`-₹${o.coupon_discount_amount.toFixed(2)}`} />
            )}
            {o.restaurant_discount_amount > 0 && (
              <Row label="Restaurant discount" value={`-₹${o.restaurant_discount_amount.toFixed(2)}`} />
            )}
            <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{o.order_amount.toFixed(2)}</span>
            </div>
          </dl>
          {o.order_note && (
            <div className="mt-3">
              <h3 className="text-xs uppercase text-zinc-500 mb-1">Order note</h3>
              <p className="text-sm">{o.order_note}</p>
            </div>
          )}
          {o.cancellation_reason && (
            <div className="mt-3 text-rose-600 text-sm">
              Canceled{o.canceled_by ? ` by ${o.canceled_by}` : ""}: {o.cancellation_reason}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Timeline</h2>
          <ol className="text-sm space-y-2">
            {TIMELINE_KEYS.map((k) => {
              const ts = o.timeline[k];
              if (!ts) return null;
              return (
                <li key={k} className="flex justify-between">
                  <span className="capitalize">{k.replace("_", " ")}</span>
                  <span className="text-zinc-500 text-xs">{new Date(ts).toLocaleString()}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Money distribution — who keeps what ──────────────────────────── */}
      {data.earnings && (
        <div className="mt-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-1">Money Distribution</h2>
          <p className="text-xs text-zinc-400 mb-4">Of the ₹{data.earnings.customer_payment.toFixed(2)} the customer paid, here is who keeps what.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SplitCard
              tone="emerald"
              title="Eatofine earns"
              amount={data.earnings.eatofine_earning}
              lines={[
                [`Commission (${data.earnings.commission_pct}%)`, data.earnings.eatofine_commission],
                ["Platform / fees", data.earnings.eatofine_platform_fee],
                // Admin-funded coupon/discount is Eatofine's promo expense.
                ...(data.earnings.admin_discount > 0
                  ? ([["− Admin discount (Eatofine bears)", -data.earnings.admin_discount]] as Array<[string, number]>)
                  : []),
              ]}
            />
            <SplitCard
              tone="sky"
              title="Restaurant gets"
              amount={data.earnings.restaurant_earning}
              lines={[
                ["Food value", data.earnings.food_amount],
                [`− Commission (${data.earnings.commission_pct}%)`, -data.earnings.eatofine_commission],
                // Restaurant-funded coupon/discount is the restaurant's expense.
                ...(data.earnings.restaurant_discount > 0
                  ? ([["− Restaurant discount (restaurant bears)", -data.earnings.restaurant_discount]] as Array<[string, number]>)
                  : []),
              ]}
            />
            <SplitCard
              tone="slate"
              title="Tax + Delivery"
              amount={data.earnings.tax_amount + data.earnings.deliveryman_earning}
              lines={[
                ["GST → government", data.earnings.tax_amount],
                ["Delivery → rider", data.earnings.deliveryman_earning],
              ]}
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-3">
            Eatofine + Restaurant + Tax + Delivery = ₹{(data.earnings.eatofine_earning + data.earnings.restaurant_earning + data.earnings.tax_amount + data.earnings.deliveryman_earning).toFixed(2)} (= customer payment). No money is lost.
          </p>
        </div>
      )}
    </div>
  );
}

function SplitCard({
  tone, title, amount, lines,
}: {
  tone: "emerald" | "sky" | "slate";
  title: string;
  amount: number;
  lines: Array<[string, number]>;
}) {
  const toneCls = {
    emerald: "border-emerald-200 bg-emerald-50/60",
    sky: "border-sky-200 bg-sky-50/60",
    slate: "border-slate-200 bg-slate-50",
  }[tone];
  const amtCls = { emerald: "text-emerald-700", sky: "text-sky-700", slate: "text-slate-700" }[tone];
  return (
    <div className={`rounded-lg border ${toneCls} p-4`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${amtCls}`}>₹{amount.toFixed(2)}</div>
      <div className="mt-2 space-y-0.5">
        {lines.map(([label, val], i) => (
          <div key={i} className="flex justify-between text-[11px] text-zinc-500">
            <span>{label}</span>
            <span className="tabular-nums">₹{val.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-600 dark:text-zinc-300">{label}</span>
      <span>{value}</span>
    </div>
  );
}

interface RefundDecision {
  mysql_id: number;
  scenario: string;
  remarks: string;
  applied_at: string;
  effects: {
    refund_amount: number;
    penalty: { target: string | null; amount: number };
    final_order_status: string;
  };
}

async function RefundHistory({ orderId }: { orderId: number }) {
  const data = await adminFetch<{ decisions: RefundDecision[] }>(
    `/admin/refund-engine/${orderId}/history`,
  ).catch(() => ({ decisions: [] as RefundDecision[] }));
  if (!data.decisions || data.decisions.length === 0) return null;
  return (
    <div className="mt-4 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Refund decisions applied</h2>
      <ol className="text-sm space-y-2">
        {data.decisions.map((d) => (
          <li key={d.mysql_id} className="border-l-2 border-rose-400 pl-3 py-1">
            <div className="text-xs text-slate-500">{new Date(d.applied_at).toLocaleString()}</div>
            <div className="font-mono text-[11px] text-slate-700">{d.scenario}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              Refund: ₹{Number(d.effects?.refund_amount ?? 0).toFixed(2)}
              {d.effects?.penalty?.target && (
                <> · Penalty: <span className="text-rose-700 font-semibold">{d.effects.penalty.target}</span> ₹{Number(d.effects.penalty.amount).toFixed(2)}</>
              )}
              {" · "}Final: {d.effects?.final_order_status}
            </div>
            <div className="text-xs text-slate-500 mt-1 italic">&ldquo;{d.remarks}&rdquo;</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
