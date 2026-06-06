"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface PosFood { id: number; name: string | null; price: number; category_id: number | null; veg?: boolean | null }
export interface PosCategory { id: number; name: string }
interface CartLine { food: PosFood; qty: number }

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function PosTerminal({
  restaurantId,
  restaurantName,
  restaurantTax,
  foods,
  categories,
}: {
  restaurantId: number;
  restaurantName: string;
  restaurantTax: number;
  foods: PosFood[];
  categories: PosCategory[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderType, setOrderType] = useState("take_away");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      if (activeCat !== "all" && f.category_id !== activeCat) return false;
      if (search.trim() && !(f.name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [foods, activeCat, search]);

  const lines = Object.values(cart);
  const subtotal = lines.reduce((s, l) => s + l.food.price * l.qty, 0);
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = taxable * (restaurantTax / 100);
  const total = taxable + taxAmount;

  function addItem(food: PosFood) {
    setCart((c) => ({ ...c, [food.id]: { food, qty: (c[food.id]?.qty ?? 0) + 1 } }));
  }
  function setQty(id: number, qty: number) {
    setCart((c) => {
      if (qty <= 0) {
        const next = { ...c };
        delete next[id];
        return next;
      }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }

  function placeOrder() {
    setError(null);
    if (lines.length === 0) {
      setError("Add at least one item to the cart");
      return;
    }
    const body = {
      restaurant_id: restaurantId,
      items: lines.map((l) => ({ food_id: l.food.id, name: l.food.name, price: l.food.price, quantity: l.qty })),
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      address: address || undefined,
      order_type: orderType,
      payment_method: paymentMethod,
      discount,
      tax_percent: restaurantTax,
    };
    startTransition(async () => {
      const res = await fetch("/api/admin/pos/place-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      const data = (await res.json()) as { id: number };
      router.push(`/dashboard/orders/${data.id}`);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* Menu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the menu…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-emerald-500"
        />
        <div className="flex gap-1 flex-wrap mb-3">
          <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>All</CatChip>
          {categories.map((c) => (
            <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>{c.name}</CatChip>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="col-span-full text-sm text-slate-400 py-8 text-center">No items.</p>
          ) : filtered.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => addItem(f)}
              className="text-left rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 p-3 transition-colors"
            >
              <div className="text-sm font-medium text-slate-800 line-clamp-2">{f.name}</div>
              <div className="mt-1 text-sm font-semibold text-emerald-700">{inr(f.price)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
        <h3 className="font-semibold text-slate-900 mb-1">Cart — {restaurantName}</h3>
        <div className="flex-1 space-y-2 max-h-[40vh] overflow-y-auto">
          {lines.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Tap menu items to add them.</p>
          ) : lines.map((l) => (
            <div key={l.food.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <div className="truncate text-slate-800">{l.food.name}</div>
                <div className="text-xs text-slate-500">{inr(l.food.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setQty(l.food.id, l.qty - 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">−</button>
                <span className="w-6 text-center tabular-nums">{l.qty}</span>
                <button type="button" onClick={() => setQty(l.food.id, l.qty + 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">+</button>
              </div>
              <div className="w-16 text-right tabular-nums font-semibold">{inr(l.food.price * l.qty)}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          {orderType === "delivery" && (
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="take_away">Take away</option>
              <option value="delivery">Delivery</option>
              <option value="dine_in">Dine in</option>
            </select>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital_payment">Digital</option>
            </select>
          </div>
          <label className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Discount ₹</span>
            <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-right" />
          </label>

          <div className="text-sm space-y-1 pt-1">
            <Row label="Subtotal" value={inr(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`−${inr(discount)}`} />}
            <Row label={`Tax (${restaurantTax}%)`} value={inr(taxAmount)} />
            <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-100">
              <span>Total</span><span className="tabular-nums">{inr(total)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={pending || lines.length === 0}
            className="w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 shadow-sm"
          >
            {pending ? "Placing…" : `Place order · ${inr(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1 rounded-lg text-xs font-semibold ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  );
}
