"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface PosZone { id: number; name: string }
export interface PosRestaurant { id: number; name: string; zone_id: number | null }
export interface PosCategory { id: number; name: string }
interface Food { id: number; name: string | null; price: number; category_id: number | null; veg?: boolean }
interface CartLine { food: Food; qty: number }

const inr = (n: number) => `₹${(n || 0).toFixed(2)}`;

/** StackFood-style POS: Food Section (zone → restaurant → categories → search →
 *  menu) on the left, Billing Section (customer, order type, items, totals) on
 *  the right. */
export function PosBoard({ zones, restaurants, categories }: { zones: PosZone[]; restaurants: PosRestaurant[]; categories: PosCategory[] }) {
  const router = useRouter();
  const [zoneId, setZoneId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [tax, setTax] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [orderType, setOrderType] = useState("take_away");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleRestaurants = useMemo(
    () => (zoneId ? restaurants.filter((r) => String(r.zone_id) === zoneId) : restaurants),
    [restaurants, zoneId],
  );

  // Load the selected restaurant's menu + tax. The synchronous resets here are
  // intentional (clear menu/cart + show a spinner the instant the restaurant
  // changes), so the set-state-in-effect rule is disabled for this block.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!restaurantId) { setFoods([]); setCart({}); return; }
    setLoading(true);
    setCart({});
    Promise.all([
      fetch(`/api/admin/food?restaurant_id=${restaurantId}&limit=500`).then((r) => r.ok ? r.json() : { food: [] }),
      fetch(`/api/admin/restaurants/${restaurantId}`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([f, d]) => {
        const rows: Food[] = (f.food ?? f.items ?? []).map((x: Record<string, unknown>) => ({
          id: Number(x.id), name: (x.name as string) ?? null, price: Number(x.price ?? 0),
          category_id: x.category_id != null ? Number(x.category_id) : null, veg: !!x.veg,
        }));
        setFoods(rows);
        setTax(Number(d?.restaurant?.tax ?? 0));
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const usedCatIds = useMemo(() => new Set(foods.map((f) => f.category_id).filter(Boolean)), [foods]);
  const menuCategories = useMemo(() => categories.filter((c) => usedCatIds.has(c.id)), [categories, usedCatIds]);

  const filteredFoods = useMemo(() => foods.filter((f) => {
    if (categoryId && String(f.category_id) !== categoryId) return false;
    if (search.trim() && !(f.name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [foods, categoryId, search]);

  const lines = Object.values(cart);
  const subtotal = lines.reduce((s, l) => s + l.food.price * l.qty, 0);
  const taxable = Math.max(0, subtotal - discount);
  const vat = taxable * (tax / 100);
  const total = taxable + vat + (orderType === "home_delivery" ? deliveryFee : 0);

  function addItem(food: Food) {
    setCart((c) => ({ ...c, [food.id]: { food, qty: (c[food.id]?.qty ?? 0) + 1 } }));
  }
  function setQty(id: number, qty: number) {
    setCart((c) => {
      if (qty <= 0) { const n = { ...c }; delete n[id]; return n; }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }

  function placeOrder() {
    setError(null);
    if (!restaurantId) { setError("Select a restaurant first"); return; }
    if (lines.length === 0) { setError("Cart is empty"); return; }
    setPlacing(true);
    fetch("/api/admin/pos/place-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        restaurant_id: Number(restaurantId),
        items: lines.map((l) => ({ food_id: l.food.id, name: l.food.name, price: l.food.price, quantity: l.qty })),
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        order_type: orderType,
        payment_method: paymentMethod,
        discount,
        tax_percent: tax,
        delivery_charge: orderType === "home_delivery" ? deliveryFee : 0,
      }),
    })
      .then(async (res) => {
        if (!res.ok) { setError((await res.text()).slice(0, 200)); setPlacing(false); return; }
        const data = (await res.json()) as { id: number };
        router.push(`/dashboard/orders/${data.id}`);
      })
      .catch(() => { setError("Failed to place order"); setPlacing(false); });
  }

  const selCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 p-6">
      {/* ── Food Section ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-800 text-sm">🍽 Food Section</div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Zone *</span>
              <select value={zoneId} onChange={(e) => { setZoneId(e.target.value); setRestaurantId(""); }} className={selCls}>
                <option value="">Select Zone</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Restaurant *</span>
              <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className={selCls}>
                <option value="">Select Restaurant</option>
                {visibleRestaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Categories</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selCls} disabled={!restaurantId}>
                <option value="">Select Categories</option>
                {menuCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Search</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex: Search Food Name" className={selCls} disabled={!restaurantId} />
            </label>
          </div>

          {!restaurantId ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <div className="text-3xl mb-2">🔍</div>
              To get accurate search results, first select a zone, then choose a restaurant.
            </div>
          ) : loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading menu…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
              {filteredFoods.length === 0 ? (
                <p className="col-span-full text-center text-slate-400 py-8 text-sm">No items.</p>
              ) : filteredFoods.map((f) => (
                <button key={f.id} type="button" onClick={() => addItem(f)} className="text-left rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 p-3 transition-colors">
                  <div className="text-sm font-medium text-slate-800 line-clamp-2">{f.name}</div>
                  <div className="mt-1 text-sm font-semibold text-emerald-700">{inr(f.price)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Billing Section ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-800 text-sm">🧾 Billing Section</div>
        <div className="p-4 space-y-3 flex-1">
          <div className="flex gap-2">
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Select / new customer name" className={selCls} />
            <button type="button" onClick={() => setShowNewCustomer((v) => !v)} className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3">Add New</button>
          </div>
          {showNewCustomer && (
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone" className={selCls} />
          )}

          <div>
            <span className="text-xs font-semibold text-slate-600">Select Order Type</span>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={orderType === "take_away"} onChange={() => setOrderType("take_away")} /> Take Away
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={orderType === "home_delivery"} onChange={() => setOrderType("home_delivery")} /> Home Delivery
              </label>
            </div>
          </div>

          {/* Items table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-slate-50 text-[11px] uppercase font-semibold text-slate-500">
              <span>Item</span><span>Qty</span><span className="text-right">Price</span><span></span>
            </div>
            {lines.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">🛒 No items added yet</div>
            ) : lines.map((l) => (
              <div key={l.food.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2 border-t border-slate-100 text-sm">
                <span className="truncate">{l.food.name}</span>
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => setQty(l.food.id, l.qty - 1)} className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs">−</button>
                  <span className="w-5 text-center">{l.qty}</span>
                  <button type="button" onClick={() => setQty(l.food.id, l.qty + 1)} className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs">+</button>
                </span>
                <span className="text-right tabular-nums">{inr(l.food.price * l.qty)}</span>
                <button type="button" onClick={() => setQty(l.food.id, 0)} className="text-rose-500 hover:text-rose-700 text-sm px-1">🗑</button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="text-sm space-y-1">
            <Row label="Addon" value={inr(0)} />
            <Row label="Subtotal" value={inr(subtotal)} />
            <label className="flex justify-between items-center text-slate-600">
              <span>Discount</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded border border-slate-300 px-2 py-0.5 text-right text-sm" />
            </label>
            {orderType === "home_delivery" && (
              <label className="flex justify-between items-center text-slate-600">
                <span>Delivery fee</span>
                <input type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded border border-slate-300 px-2 py-0.5 text-right text-sm" />
              </label>
            )}
            <Row label={`Vat/tax (${tax}%)`} value={inr(vat)} />
            <Row label="Service Charge" value={inr(0)} />
            <Row label="Extra Packaging Amount" value={inr(0)} />
            <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-100">
              <span>Total</span><span className="tabular-nums">{inr(total)}</span>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Paid by</span>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selCls}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital_payment">Digital payment</option>
            </select>
          </label>

          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 border-t border-slate-100">
          <button type="button" onClick={placeOrder} disabled={placing || lines.length === 0} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 shadow-sm">
            {placing ? "Placing…" : "Place Order"}
          </button>
          <button type="button" onClick={() => setCart({})} className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 border border-slate-200">Clear Cart</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  );
}
