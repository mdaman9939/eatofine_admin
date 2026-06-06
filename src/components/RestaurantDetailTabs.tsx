"use client";

import { useState } from "react";
import Link from "next/link";

export interface RestaurantTabData {
  foods: Array<{ id: number; name: string | null; price: number; image: string | null; status: boolean; veg: boolean | null }>;
  orders: Array<{ id: number; order_amount: number; order_status: string | null; payment_status: string | null; order_type: string | null; created_at: string | null }>;
  reviews: Array<{ id: number; rating: number; comment: string | null; reply: string | null; food_id: number | null; customer: string | null }>;
  transactions: Array<{ id: number; order_amount: number; commission: number; restaurant_earning: number; order_status: string | null; created_at: string | null }>;
  wallet: { total_earning: number; commission_paid: number; restaurant_earning?: number; delivered_count: number; total_orders: number; avg_rating: number; rating_count: number };
}

const TABS = ["Foods", "Orders", "Reviews", "Wallet", "Transactions"] as const;
type Tab = (typeof TABS)[number];

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

export function RestaurantDetailTabs({ data }: { data: RestaurantTabData }) {
  const [tab, setTab] = useState<Tab>("Foods");

  const counts: Record<Tab, number> = {
    Foods: data.foods.length,
    Orders: data.orders.length,
    Reviews: data.reviews.length,
    Wallet: data.wallet.total_orders,
    Transactions: data.transactions.length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              tab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t} <span className="text-xs text-slate-400">({counts[t]})</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "Foods" && <FoodsTab data={data.foods} />}
        {tab === "Orders" && <OrdersTab data={data.orders} />}
        {tab === "Reviews" && <ReviewsTab data={data.reviews} />}
        {tab === "Wallet" && <WalletTab wallet={data.wallet} />}
        {tab === "Transactions" && <TransactionsTab data={data.transactions} />}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-slate-400 py-8 text-center">No {label} yet.</p>;
}

function FoodsTab({ data }: { data: RestaurantTabData["foods"] }) {
  if (!data.length) return <Empty label="foods" />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((f) => (
        <Link key={f.id} href={`/dashboard/food/${f.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">{f.name ?? "—"}</div>
            <div className="text-xs text-slate-500">#{f.id} {f.veg === true ? "· Veg" : f.veg === false ? "· Non-veg" : ""}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold tabular-nums">{inr(f.price)}</div>
            <span className={`text-[10px] font-semibold ${f.status ? "text-emerald-600" : "text-slate-400"}`}>{f.status ? "Active" : "Hidden"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function OrdersTab({ data }: { data: RestaurantTabData["orders"] }) {
  if (!data.length) return <Empty label="orders" />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-500">
          <th className="py-2">Order</th><th>Type</th><th>Status</th><th>Payment</th><th className="text-right">Amount</th><th className="text-right">Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map((o) => (
          <tr key={o.id} className="border-t border-slate-100">
            <td className="py-2"><Link href={`/dashboard/orders/${o.id}`} className="text-emerald-700 hover:underline font-mono">#{o.id}</Link></td>
            <td className="text-slate-600">{o.order_type ?? "—"}</td>
            <td><span className="text-xs font-semibold text-slate-700">{o.order_status ?? "—"}</span></td>
            <td className="text-xs text-slate-500">{o.payment_status ?? "—"}</td>
            <td className="text-right tabular-nums font-semibold">{inr(o.order_amount)}</td>
            <td className="text-right text-xs text-slate-500">{fmtDate(o.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReviewsTab({ data }: { data: RestaurantTabData["reviews"] }) {
  if (!data.length) return <Empty label="reviews" />;
  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">{r.customer ?? "Anonymous"}</span>
            <span className="text-amber-500 text-sm">{"★".repeat(Math.round(r.rating))}<span className="text-slate-300">{"★".repeat(5 - Math.round(r.rating))}</span></span>
          </div>
          {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
          {r.reply && <p className="text-xs text-slate-500 mt-1 pl-3 border-l-2 border-emerald-200">Reply: {r.reply}</p>}
        </div>
      ))}
    </div>
  );
}

function WalletTab({ wallet }: { wallet: RestaurantTabData["wallet"] }) {
  const cards = [
    { label: "Total earning (paid)", value: inr(wallet.total_earning) },
    { label: "Commission paid", value: inr(wallet.commission_paid) },
    { label: "Restaurant earning", value: inr(wallet.restaurant_earning ?? wallet.total_earning - wallet.commission_paid) },
    { label: "Delivered orders", value: String(wallet.delivered_count) },
    { label: "Total orders", value: String(wallet.total_orders) },
    { label: `Avg rating (${wallet.rating_count})`, value: `★ ${wallet.avg_rating.toFixed(1)}` },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-slate-200 p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{c.label}</div>
          <div className="mt-1 text-xl font-bold text-slate-900 tabular-nums">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function TransactionsTab({ data }: { data: RestaurantTabData["transactions"] }) {
  if (!data.length) return <Empty label="transactions" />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-500">
          <th className="py-2">Order</th><th className="text-right">Amount</th><th className="text-right">Commission</th><th className="text-right">Earning</th><th className="text-right">Date</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id} className="border-t border-slate-100">
            <td className="py-2 font-mono">#{t.id}</td>
            <td className="text-right tabular-nums">{inr(t.order_amount)}</td>
            <td className="text-right tabular-nums text-rose-600">−{inr(t.commission)}</td>
            <td className="text-right tabular-nums font-semibold text-emerald-700">{inr(t.restaurant_earning)}</td>
            <td className="text-right text-xs text-slate-500">{fmtDate(t.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
