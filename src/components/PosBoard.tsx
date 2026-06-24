"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TaxBreakdownDisclosure } from "./TaxBreakdownSheet";

export interface PosZone { id: number; name: string }
export interface PosRestaurant { id: number; name: string; zone_id: number | null }
export interface PosCategory { id: number; name: string }
interface AddOn { id: number; name: string; price: number }
interface Food { id: number; name: string | null; price: number; category_id: number | null; veg?: boolean; add_ons?: number[] }
interface CartLine { food: Food; qty: number; addOns: number[] }
/** A configured platform charge (Additional Charges admin page). */
interface AdditionalCharge {
  id: number;
  charge_head: string;
  charge_type: "fixed" | "percentage";
  amount: number;
  gst_applicable: boolean;
  gst_rate: number;
  status: boolean;
  order_types: string[];
}
/** A coupon usable for the selected restaurant (POS coupon picker). */
interface CouponOpt {
  id: number;
  code: string;
  title: string;
  discount: number;
  discount_type: string;
  min_purchase: number;
  max_discount: number;
}

const inr = (n: number) => `₹${(n || 0).toFixed(2)}`;
const ORDER_TYPE_LABEL: Record<string, string> = { take_away: "Take Away", dine_in: "Dine In", delivery: "Home Delivery" };

/** Preview a coupon's discount on a known order base — MIRRORS the backend
 *  validateAndComputeCoupon math so the displayed total equals what's charged.
 *  Returns 0 when the min-purchase isn't met (backend would reject it). */
function previewCouponDiscount(c: CouponOpt | undefined, base: number): number {
  if (!c) return 0;
  if (c.min_purchase && base < c.min_purchase) return 0;
  let d = c.discount_type === "percent" || c.discount_type === "percentage"
    ? (base * c.discount) / 100
    : c.discount;
  if (c.max_discount > 0) d = Math.min(d, c.max_discount);
  return Math.min(Math.round(d * 100) / 100, base);
}

/** StackFood-style POS: Food Section (zone → restaurant → categories → search →
 *  menu) on the left, Billing Section (customer, order type, items, totals) on
 *  the right. */
export function PosBoard({ zones, restaurants, categories, foodGstRate = 5, foodGstOrderTypes = ["delivery"] }: { zones: PosZone[]; restaurants: PosRestaurant[]; categories: PosCategory[]; foodGstRate?: number; foodGstOrderTypes?: string[] }) {
  const router = useRouter();
  const [zoneId, setZoneId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [addOnMap, setAddOnMap] = useState<Record<number, AddOn>>({});
  // Food GST rate is the PLATFORM's (admin-configured, sec 9(5)) — same for every
  // restaurant, not restaurant.tax. So GST always shows even for 0%-tax outlets.
  const [tax, setTax] = useState(foodGstRate);
  const [extraPackaging, setExtraPackaging] = useState(0);
  const [charges, setCharges] = useState<AdditionalCharge[]>([]);
  const [coupons, setCoupons] = useState<CouponOpt[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [orderType, setOrderType] = useState("take_away");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  // Apply/waive toggles for the auto-applied charges. All default ON so the
  // billing behaves exactly as before until the admin unticks something.
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [packagingEnabled, setPackagingEnabled] = useState(true);
  const [disabledCharges, setDisabledCharges] = useState<Set<number>>(new Set());
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleRestaurants = useMemo(
    () => (zoneId ? restaurants.filter((r) => String(r.zone_id) === zoneId) : restaurants),
    [restaurants, zoneId],
  );

  // Load the platform's configured additional charges once (charges plan).
  useEffect(() => {
    fetch("/api/admin/additional-charges")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: AdditionalCharge[]) => {
        const list = Array.isArray(rows) ? rows : [];
        setCharges(
          list
            .filter((c) => c.status)
            .map((c) => ({
              ...c,
              amount: Number(c.amount ?? 0),
              gst_rate: Number(c.gst_rate ?? 0),
              // Only a missing/non-array field defaults to all three; an explicit
              // empty array stays "applies to none" (matches the backend).
              order_types: Array.isArray(c.order_types) ? c.order_types : ["take_away", "dine_in", "delivery"],
            })),
        );
      })
      .catch(() => setCharges([]));
  }, []);

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
      fetch(`/api/admin/add-ons?restaurant_id=${restaurantId}&limit=500`).then((r) => r.ok ? r.json() : null),
    ])
      .then(([f, d, a]) => {
        const rows: Food[] = (f.food ?? f.items ?? []).map((x: Record<string, unknown>) => ({
          id: Number(x.id), name: (x.name as string) ?? null, price: Number(x.price ?? 0),
          category_id: x.category_id != null ? Number(x.category_id) : null, veg: !!x.veg,
          add_ons: Array.isArray(x.add_ons) ? (x.add_ons as unknown[]).map((v) => Number(v)).filter((n) => Number.isFinite(n)) : [],
        }));
        setFoods(rows);
        // Map the restaurant's add-ons by id so each food's add_on ids resolve.
        const addonRows = (a?.data ?? a?.items ?? a?.add_ons ?? (Array.isArray(a) ? a : [])) as Record<string, unknown>[];
        const map: Record<number, AddOn> = {};
        for (const x of addonRows) {
          const id = Number(x.id ?? x.mysql_id);
          if (Number.isFinite(id)) map[id] = { id, name: String(x.name ?? `Add-on ${id}`), price: Number(x.price ?? 0) };
        }
        setAddOnMap(map);
        setTax(foodGstRate); // platform food-GST rate, independent of the restaurant's own tax
        // Restaurant extra-packaging charge (applied to take-away orders).
        const pkgActive = d?.restaurant?.is_extra_packaging_active ?? d?.restaurant?.extra_packaging_status ?? false;
        setExtraPackaging(pkgActive ? Number(d?.restaurant?.extra_packaging_amount ?? 0) : 0);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load the coupons usable for the selected restaurant (restaurant-specific +
  // platform-wide). The picker shows what discount each restaurant offers; the
  // discount is recomputed authoritatively by the backend at place-order time.
  useEffect(() => {
    setSelectedCouponCode("");
    if (!restaurantId) { setCoupons([]); return; }
    let cancelled = false;
    fetch(`/api/admin/restaurants/${restaurantId}/coupons`)
      .then((r) => (r.ok ? r.json() : { coupons: [] }))
      .then((d: { coupons?: CouponOpt[] }) => {
        if (cancelled) return;
        setCoupons(Array.isArray(d?.coupons) ? d.coupons : []);
      })
      .catch(() => { if (!cancelled) setCoupons([]); });
    return () => { cancelled = true; };
  }, [restaurantId]);

  const usedCatIds = useMemo(() => new Set(foods.map((f) => f.category_id).filter(Boolean)), [foods]);
  const menuCategories = useMemo(() => categories.filter((c) => usedCatIds.has(c.id)), [categories, usedCatIds]);

  const filteredFoods = useMemo(() => foods.filter((f) => {
    if (categoryId && String(f.category_id) !== categoryId) return false;
    if (search.trim() && !(f.name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [foods, categoryId, search]);

  const lines = Object.values(cart);
  const subtotal = lines.reduce((s, l) => s + l.food.price * l.qty, 0);
  const lineAddOnTotal = (l: CartLine) => l.addOns.reduce((s, id) => s + (addOnMap[id]?.price ?? 0), 0);
  const addonTotal = lines.reduce((s, l) => s + lineAddOnTotal(l) * l.qty, 0);
  // Coupon discount — its base mirrors the backend's POS subtotal (items +
  // add-ons). The preview math matches validateAndComputeCoupon so the shown
  // total equals what the backend charges + records.
  const selectedCoupon = useMemo(() => coupons.find((c) => c.code === selectedCouponCode), [coupons, selectedCouponCode]);
  const couponBase = subtotal + addonTotal;
  const couponDiscount = previewCouponDiscount(selectedCoupon, couponBase);
  const couponIneligible = !!selectedCoupon && couponDiscount === 0;
  // Manual discount + coupon both reduce the taxable food value.
  const taxable = Math.max(0, couponBase - discount - couponDiscount);
  // Gross GST is always computed (for display); it only feeds the total when the
  // GST checkbox is ticked AND food GST applies to this order type.
  const vatGross = taxable * (tax / 100);
  // Food GST + extra packaging apply only to the order types configured on the
  // Additional Charges screen (food_gst_order_types). The per-charge platform /
  // convenience / packaging fees are scoped on each charge's own order_types.
  const foodGstApplies = foodGstOrderTypes.includes(orderType);
  const vat = taxEnabled && foodGstApplies ? vatGross : 0;

  // Each configured charge that applies to THIS order type, resolved against the
  // order's subtotal (incl. its own GST).
  const chargeRows = useMemo(
    () =>
      charges
        .filter((c) => c.order_types.includes(orderType))
        .map((c) => {
          const base = c.charge_type === "fixed" ? c.amount : (subtotal * c.amount) / 100;
          const gst = c.gst_applicable ? (base * c.gst_rate) / 100 : 0;
          // Expose the already-computed GST portion + a packaging flag so the
          // Taxes & Charges breakdown can regroup these without recomputing tax.
          return { id: c.id, label: c.charge_head, amount: base + gst, gst, gstRate: c.gst_rate, isPackaging: /packag/i.test(c.charge_head) };
        }),
    [charges, subtotal, orderType],
  );
  // Only charges left ticked contribute to the total; unticked ones are still
  // shown (struck-through) but excluded from the bill and the placed order.
  // Round to paise here so the SAME value feeds the displayed total AND the
  // placed order — otherwise the display (unrounded) and the stored order_amount
  // (built from the .toFixed(2) we send) could differ by ₹0.01.
  const additionalChargeTotal = Math.round(chargeRows.reduce((s, r) => s + (disabledCharges.has(r.id) ? 0 : r.amount), 0) * 100) / 100;
  // Extra packaging applies to take-away orders (StackFood behaviour), only when
  // its checkbox is ticked, and only when food GST/packaging applies to this type.
  const packagingGross = orderType === "take_away" ? extraPackaging : 0;
  const packagingAmount = Math.round((packagingEnabled && foodGstApplies ? packagingGross : 0) * 100) / 100;

  const total =
    taxable +
    vat +
    additionalChargeTotal +
    packagingAmount +
    (orderType === "delivery" ? deliveryFee : 0);

  // ── Taxes & Charges breakdown (Zomato-style) — DERIVED from the values above,
  //    no new tax math. Restaurant GST = the food tax; each non-packaging service
  //    charge contributes its own already-computed GST; packaging-type charges +
  //    extra packaging are shown as Packaging Charges. POS is a walk-in counter
  //    sale (no inter-state delivery address) → intra-state CGST/SGST. ──
  const enabledCharges = chargeRows.filter((r) => !disabledCharges.has(r.id));
  const serviceCharges = enabledCharges.filter((r) => !r.isPackaging && r.gst > 0);
  const packagingChargeTotal = packagingAmount + enabledCharges.filter((r) => r.isPackaging).reduce((s, r) => s + r.amount, 0);
  const serviceGstRates = Array.from(new Set(serviceCharges.map((r) => Number(r.gstRate)).filter((n) => n > 0)));
  const taxBreakdown = {
    restaurantGst: taxEnabled && vatGross > 0
      ? { ratePct: tax, interState: false, cgst: vatGross / 2, sgst: vatGross / 2, igst: vatGross,
          label: "GST on Food", note: "Collected by platform & paid to Govt (GST sec 9(5)) — not the restaurant" }
      : null,
    platformServiceGst: serviceCharges.length
      ? { ratePct: serviceGstRates.length === 1 ? serviceGstRates[0] : null, items: serviceCharges.map((r) => ({ label: `${r.label} GST`, amount: r.gst })) }
      : null,
    packagingCharges: packagingChargeTotal,
  };

  function addItem(food: Food) {
    setCart((c) => ({ ...c, [food.id]: { food, qty: (c[food.id]?.qty ?? 0) + 1, addOns: c[food.id]?.addOns ?? [] } }));
  }
  function setQty(id: number, qty: number) {
    setCart((c) => {
      if (qty <= 0) { const n = { ...c }; delete n[id]; return n; }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }
  function toggleAddOn(foodId: number, addOnId: number) {
    setCart((c) => {
      const line = c[foodId];
      if (!line) return c;
      const has = line.addOns.includes(addOnId);
      return { ...c, [foodId]: { ...line, addOns: has ? line.addOns.filter((x) => x !== addOnId) : [...line.addOns, addOnId] } };
    });
  }

  function toggleCharge(id: number) {
    setDisabledCharges((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function placeOrder() {
    setError(null);
    if (!restaurantId) { setError("Select a restaurant first"); return; }
    if (lines.length === 0) { setError("Cart is empty"); return; }
    if (orderType === "dine_in" && !tableNumber.trim()) { setError("Table number is required for dine in"); return; }
    // Phone is optional, but when given it must be a valid 10-digit Indian mobile.
    if (customerPhone && !/^[6-9]\d{9}$/.test(customerPhone)) {
      setError("Enter a valid 10-digit Indian mobile number (starts with 6–9)");
      return;
    }
    if (couponIneligible) {
      setError(`Coupon ${selectedCouponCode} needs a minimum order of ₹${selectedCoupon?.min_purchase}. Remove it or add items.`);
      return;
    }
    setPlacing(true);
    fetch("/api/admin/pos/place-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        restaurant_id: Number(restaurantId),
        items: lines.map((l) => ({
          food_id: l.food.id, name: l.food.name, price: l.food.price, quantity: l.qty,
          add_ons: l.addOns.map((id) => ({ id, name: addOnMap[id]?.name ?? null, price: addOnMap[id]?.price ?? 0 })),
        })),
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber.trim() : undefined,
        payment_method: paymentMethod,
        discount,
        // The backend re-validates + recomputes the coupon discount (authoritative).
        coupon_code: selectedCouponCode || undefined,
        // Send 0% GST when the tax checkbox is unticked so the backend's
        // taxAmount is 0 — the placed order matches the displayed total.
        tax_percent: taxEnabled ? tax : 0,
        delivery_charge: orderType === "delivery" ? deliveryFee : 0,
        // Already filtered to ticked charges / enabled packaging above.
        additional_charge: Number(additionalChargeTotal.toFixed(2)),
        extra_packaging_amount: Number(packagingAmount.toFixed(2)),
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
            <div>
              {/* Indian mobile only: digits, max 10, must start 6–9. Strip
                  non-digits + cap at 10 as the user types. */}
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Customer phone (10-digit Indian)"
                inputMode="numeric"
                maxLength={10}
                className={selCls}
              />
              {customerPhone !== "" && !/^[6-9]\d{9}$/.test(customerPhone) && (
                <p className="mt-1 text-[11px] text-rose-600">Enter a valid 10-digit Indian mobile number (starts with 6–9).</p>
              )}
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-slate-600">Select Order Type</span>
            <div className="flex gap-4 mt-1 flex-wrap">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={orderType === "take_away"} onChange={() => setOrderType("take_away")} /> Take Away
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={orderType === "delivery"} onChange={() => setOrderType("delivery")} /> Home Delivery
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" checked={orderType === "dine_in"} onChange={() => setOrderType("dine_in")} /> Dine In
              </label>
            </div>
            {orderType === "dine_in" && (
              <input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table number (required)"
                className={`${selCls} mt-2`}
              />
            )}
          </div>

          {/* Items table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-slate-50 text-[11px] uppercase font-semibold text-slate-500">
              <span>Item</span><span>Qty</span><span className="text-right">Price</span><span></span>
            </div>
            {lines.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">🛒 No items added yet</div>
            ) : lines.map((l) => {
              const available = (l.food.add_ons ?? []).map((id) => addOnMap[id]).filter(Boolean) as AddOn[];
              return (
                <div key={l.food.id} className="border-t border-slate-100">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2 text-sm">
                    <span className="truncate">{l.food.name}</span>
                    <span className="flex items-center gap-1">
                      <button type="button" onClick={() => setQty(l.food.id, l.qty - 1)} className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs">−</button>
                      <span className="w-5 text-center">{l.qty}</span>
                      <button type="button" onClick={() => setQty(l.food.id, l.qty + 1)} className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs">+</button>
                    </span>
                    <span className="text-right tabular-nums">{inr((l.food.price + lineAddOnTotal(l)) * l.qty)}</span>
                    <button type="button" onClick={() => setQty(l.food.id, 0)} className="text-rose-500 hover:text-rose-700 text-sm px-1">🗑</button>
                  </div>
                  {available.length > 0 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                      {available.map((a) => {
                        const on = l.addOns.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleAddOn(l.food.id, a.id)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border transition ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"}`}
                          >
                            {on ? "✓ " : "+ "}{a.name} ({inr(a.price)})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="text-sm space-y-1">
            <Row label="Addon" value={inr(addonTotal)} />
            <Row label="Subtotal" value={inr(subtotal)} />
            <label className="flex justify-between items-center text-slate-600">
              <span>Discount</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded border border-slate-300 px-2 py-0.5 text-right text-sm" />
            </label>
            {/* Coupon — restaurant-wise; shows what each restaurant offers. The
                backend re-validates + recomputes the discount authoritatively. */}
            {restaurantId && coupons.length > 0 && (
              <div className="space-y-1">
                <label className="flex justify-between items-center gap-2 text-slate-600">
                  <span className="shrink-0">Coupon</span>
                  <select
                    value={selectedCouponCode}
                    onChange={(e) => setSelectedCouponCode(e.target.value)}
                    className="flex-1 min-w-0 max-w-[15rem] rounded border border-slate-300 px-2 py-0.5 text-sm"
                  >
                    <option value="">No coupon</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.discount_type === "percent" || c.discount_type === "percentage" ? `${c.discount}%` : inr(c.discount)}{c.min_purchase ? ` (min ₹${c.min_purchase})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedCouponCode && !couponIneligible && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon ({selectedCouponCode})</span>
                    <span className="tabular-nums">− {inr(couponDiscount)}</span>
                  </div>
                )}
                {couponIneligible && (
                  <p className="text-[11px] text-amber-600">
                    Add {inr((selectedCoupon?.min_purchase ?? 0) - couponBase)} more to use {selectedCouponCode}.
                  </p>
                )}
              </div>
            )}
            {orderType === "delivery" && (
              <label className="flex justify-between items-center text-slate-600">
                <span>Delivery fee</span>
                <input type="number" min={0} value={deliveryFee} onChange={(e) => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))} className="w-24 rounded border border-slate-300 px-2 py-0.5 text-right text-sm" />
              </label>
            )}
            {/* Food GST — applies only to the order types configured on the
                Additional Charges screen (food_gst_order_types). */}
            {foodGstApplies && (
              <ChargeToggleRow
                label={`GST (${tax}%)`}
                value={inr(vatGross)}
                checked={taxEnabled}
                onChange={setTaxEnabled}
              />
            )}
            {/* Configured platform charges that apply to THIS order type. Tick to
                apply, untick to waive — affects the total and the placed order. */}
            {chargeRows.map((c) => (
              <ChargeToggleRow
                key={c.id}
                label={c.label}
                value={inr(c.amount)}
                checked={!disabledCharges.has(c.id)}
                onChange={() => toggleCharge(c.id)}
              />
            ))}
            {/* Extra packaging — bundled with food GST's order-type scope. */}
            {foodGstApplies && packagingGross > 0 && (
              <ChargeToggleRow
                label="Extra Packaging Amount"
                value={inr(packagingGross)}
                checked={packagingEnabled}
                onChange={setPackagingEnabled}
              />
            )}
            {!foodGstApplies && chargeRows.length === 0 && (
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                No GST or additional charges are configured for {ORDER_TYPE_LABEL[orderType] ?? orderType} orders.
                Manage these on the <span className="font-medium">Additional Charges</span> screen.
              </p>
            )}
            {(foodGstApplies || chargeRows.length > 0) && (
              <TaxBreakdownDisclosure data={taxBreakdown} className="mt-1.5" />
            )}
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

/** A billing line with an apply/waive checkbox. When unticked, the row is shown
 *  struck-through and its amount is excluded from the total and the order. */
function ChargeToggleRow({
  label,
  value,
  checked,
  onChange,
}: {
  label: string;
  value: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const strike = checked ? "" : "line-through text-slate-400";
  return (
    <label className="flex justify-between items-center text-slate-600 cursor-pointer select-none">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-emerald-600 cursor-pointer"
        />
        <span className={strike}>{label}</span>
      </span>
      <span className={`tabular-nums ${strike}`}>{value}</span>
    </label>
  );
}
