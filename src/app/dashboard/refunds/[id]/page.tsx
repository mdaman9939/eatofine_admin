import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../lib/api";
import { ActionButton } from "../../../../components/ActionButton";

interface Refund {
  id: number;
  order_id: number;
  user_id: number;
  order_status: string;
  customer_reason: string | null;
  refund_amount: number;
  refund_status: string;
  refund_method: string;
  admin_note?: string | null;
  created_at: string | null;
}

interface OrderDetail {
  order: {
    id: number;
    order_amount: number;
    total_tax_amount: number;
    delivery_charge: number;
    payment_status: string;
    order_status: string;
    payment_method: string | null;
    order_type: string | null;
    order_note: string | null;
    delivery_address: string | null;
    created_at: string | null;
  } | null;
  user: { f_name: string | null; l_name: string | null; email: string | null; phone: string | null } | null;
  restaurant: { name: string | null; phone: string | null } | null;
}

const NEXT_STATES = ["approved", "rejected", "completed"];
const inr = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-IN") : "—");

export default async function RefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await adminFetch<{ items: Refund[] }>("/admin/refunds?limit=500");
  const refund = list.items.find((r) => String(r.id) === id);
  if (!refund) notFound();

  // Pull the full order so the admin can see what's being refunded.
  const order = await adminFetch<OrderDetail>(`/admin/orders/${refund.order_id}`).catch(() => null);
  const customer = order?.user
    ? `${order.user.f_name ?? ""} ${order.user.l_name ?? ""}`.trim() || order.user.email || order.user.phone
    : `#${refund.user_id}`;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/refunds" className="text-sm text-emerald-700 hover:underline">← All refund requests</Link>
          <h1 className="mt-1 text-2xl font-semibold">Refund #{refund.id}</h1>
          <p className="text-sm text-slate-500">
            For order{" "}
            <Link href={`/dashboard/orders/${refund.order_id}`} className="text-emerald-700 hover:underline font-mono">#{refund.order_id}</Link>
            {" "}· raised {fmt(refund.created_at)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 capitalize">
          {refund.refund_status}
        </span>
      </div>

      {/* Refund summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card label="Refund amount" value={inr(refund.refund_amount)} />
        <Card label="Method" value={refund.refund_method === "wallet" ? "Wallet" : "Original payment"} />
        <Card label="Status" value={refund.refund_status} className="capitalize" />
        <Card label="Order status" value={refund.order_status} className="capitalize" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer reason */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Customer&apos;s reason</h2>
          <p className="text-sm text-slate-700 whitespace-pre-line">{refund.customer_reason || "— no reason provided —"}</p>
          {refund.admin_note && (
            <>
              <h3 className="text-xs font-semibold uppercase text-slate-500 mt-4 mb-1">Admin note</h3>
              <p className="text-sm text-slate-600">{refund.admin_note}</p>
            </>
          )}
        </div>

        {/* Customer + restaurant */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Parties</h2>
          <KV label="Customer" value={customer} />
          <KV label="Customer phone" value={order?.user?.phone ?? null} />
          <KV label="Restaurant" value={order?.restaurant?.name ?? null} />
          <KV label="Restaurant phone" value={order?.restaurant?.phone ?? null} />
        </div>
      </div>

      {/* Order financials */}
      {order?.order && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Order being refunded</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <KV label="Order amount" value={inr(order.order.order_amount)} />
            <KV label="Tax" value={inr(order.order.total_tax_amount)} />
            <KV label="Delivery" value={inr(order.order.delivery_charge)} />
            <KV label="Payment" value={`${order.order.payment_method ?? "—"} (${order.order.payment_status})`} />
            <KV label="Type" value={order.order.order_type} />
            <KV label="Placed" value={fmt(order.order.created_at)} />
            <KV label="Address" value={order.order.delivery_address} />
            <KV label="Note" value={order.order.order_note} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Decision</h2>
        <div className="flex flex-wrap gap-2">
          {NEXT_STATES.filter((s) => s !== refund.refund_status).map((s) => (
            <ActionButton
              key={s}
              path={`/refunds/${refund.id}/status`}
              method="PATCH"
              body={{ status: s }}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              variant={s === "rejected" ? "danger" : s === "completed" ? "primary" : "subtle"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold text-slate-900 ${className}`}>{value}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 text-right">{value || "—"}</span>
    </div>
  );
}
