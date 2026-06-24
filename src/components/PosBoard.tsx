"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPicker } from "./MapPicker";

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
interface CustomerOpt { id: number; name: string; phone: string }
interface AddressOpt { id: number; address: string | null; latitude: string | null; longitude: string | null; address_type: string | null; is_default?: number }
interface DeliveryQuote {
  distance_km: number;
  delivery_charge: number;
  delivery_gst: number;
  free_delivery: boolean;
  slab_min_km?: number | null;
  slab_max_km?: number | null;
  priced_by?: string | null;
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

/** Parse a "lat,lng" string into a coords pair, or null if incomplete/invalid. */
function parsePin(s: string): { lat: string; lng: string } | null {
  const [a, b] = (s || "").split(",");
  const lat = (a ?? "").trim(); const lng = (b ?? "").trim();
  if (!lat || !lng || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return { lat, lng };
}

/** Admin-operated POS that mirrors the CUSTOMER checkout: charges apply
 *  automatically from config (no per-charge override list), delivery is computed
 *  from the customer's address by distance, and the only manual control is one
 *  switch to apply/waive the configured additional charge (Platform Fee). */
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

  // Customer — search & pick an existing customer, or enter a walk-in by name.
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerOpt[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOpt | null>(null);
  const [walkIn, setWalkIn] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [orderType, setOrderType] = useState("take_away");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Delivery — pick a saved address or drop a map pin; the fee auto-computes.
  const [addresses, setAddresses] = useState<AddressOpt[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addrMode, setAddrMode] = useState<"saved" | "map">("saved");
  const [mapPin, setMapPin] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteFailed, setQuoteFailed] = useState(false);

  // The one manual control: apply or waive the configured additional charge.
  const [applyAdditional, setApplyAdditional] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleRestaurants = useMemo(
    () => (zoneId ? restaurants.filter((r) => String(r.zone_id) === zoneId) : restaurants),
    [restaurants, zoneId],
  );

  // Load the platform's configured additional charges once.
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
              order_types: Array.isArray(c.order_types) ? c.order_types : ["take_away", "dine_in", "delivery"],
            })),
        );
      })
      .catch(() => setCharges([]));
  }, []);

  // Load the selected restaurant's menu + extra-packaging. Sync resets here are
  // intentional (clear menu/cart + show a spinner the instant it changes).
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
        const addonRows = (a?.data ?? a?.items ?? a?.add_ons ?? (Array.isArray(a) ? a : [])) as Record<string, unknown>[];
        const map: Record<number, AddOn> = {};
        for (const x of addonRows) {
          const id = Number(x.id ?? x.mysql_id);
          if (Number.isFinite(id)) map[id] = { id, name: String(x.name ?? `Add-on ${id}`), price: Number(x.price ?? 0) };
        }
        setAddOnMap(map);
        setTax(foodGstRate); // platform food-GST rate, independent of the restaurant's own tax
        const pkgActive = d?.restaurant?.is_extra_packaging_active ?? d?.restaurant?.extra_packaging_status ?? false;
        setExtraPackaging(pkgActive ? Number(d?.restaurant?.extra_packaging_amount ?? 0) : 0);
      })
      .finally(() => setLoading(false));
  }, [restaurantId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Restaurant-wise coupons for the picker (recomputed authoritatively on place).
  useEffect(() => {
    setSelectedCouponCode("");
    if (!restaurantId) { setCoupons([]); return; }
    let cancelled = false;
    fetch(`/api/admin/restaurants/${restaurantId}/coupons`)
      .then((r) => (r.ok ? r.json() : { coupons: [] }))
      .then((d: { coupons?: CouponOpt[] }) => { if (!cancelled) setCoupons(Array.isArray(d?.coupons) ? d.coupons : []); })
      .catch(() => { if (!cancelled) setCoupons([]); });
    return () => { cancelled = true; };
  }, [restaurantId]);

  // Customer search (debounced) — only while typing in the search box.
  useEffect(() => {
    if (selectedCustomer || walkIn) { setCustomerResults([]); return; }
    const q = customerQuery.trim();
    if (q.length < 2) { setCustomerResults([]); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(q)}&limit=8`)
        .then((r) => (r.ok ? r.json() : { users: [] }))
        .then((d: { users?: Array<{ id: number; f_name?: string; l_name?: string; phone?: string }> }) => {
          if (cancelled) return;
          setCustomerResults((d.users ?? []).map((u) => ({
            id: Number(u.id),
            name: `${u.f_name ?? ""} ${u.l_name ?? ""}`.trim() || `#${u.id}`,
            phone: u.phone ?? "",
          })));
        })
        .catch(() => { if (!cancelled) setCustomerResults([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [customerQuery, selectedCustomer, walkIn]);

  // Load the selected customer's saved addresses for the delivery picker.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedCustomer) { setAddresses([]); setSelectedAddressId(null); return; }
    let cancelled = false;
    fetch(`/api/admin/users/${selectedCustomer.id}/addresses`)
      .then((r) => (r.ok ? r.json() : { addresses: [] }))
      .then((d: { addresses?: AddressOpt[] }) => {
        if (cancelled) return;
        const list = (d.addresses ?? []).filter((a) => a.latitude && a.longitude);
        setAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        setSelectedAddressId(def ? def.id : null);
        setAddrMode(list.length ? "saved" : "map");
      })
      .catch(() => { if (!cancelled) { setAddresses([]); setSelectedAddressId(null); setAddrMode("map"); } });
    return () => { cancelled = true; };
  }, [selectedCustomer]);
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
  const lineAddOnTotal = (l: CartLine) => l.addOns.reduce((s, id) => s + (addOnMap[id]?.price ?? 0), 0);
  const addonTotal = lines.reduce((s, l) => s + lineAddOnTotal(l) * l.qty, 0);
  // Coupon — base mirrors the backend's POS subtotal (items + add-ons, pre-coupon).
  const selectedCoupon = useMemo(() => coupons.find((c) => c.code === selectedCouponCode), [coupons, selectedCouponCode]);
  const couponBase = subtotal + addonTotal;
  const couponDiscount = previewCouponDiscount(selectedCoupon, couponBase);
  const couponIneligible = !!selectedCoupon && couponDiscount === 0;

  // Coupon reduces the taxable base (no manual discount in the POS now).
  const taxable = Math.max(0, couponBase - couponDiscount);
  // Food GST + extra packaging apply only to the order types configured on the
  // Additional Charges screen. The additional (platform) charge is scoped by each
  // charge's own order_types and applies independently of GST.
  const foodGstApplies = foodGstOrderTypes.includes(orderType);
  // Unrounded so the grand total matches the backend (which sums unrounded food
  // GST + quoted delivery GST + identically-rounded charge components, then
  // rounds once). The display line rounds via inr() for cosmetics only.
  const vat = foodGstApplies ? taxable * (tax / 100) : 0;

  // Configured additional charge for THIS order type — FIXED charges only (+ each
  // charge's GST), IDENTICAL to the customer flow (computeFlatAdditionalCharge).
  // One value, gated by the single Apply switch. The backend recomputes it the
  // same way, so the shown amount equals the charged amount.
  const applicableCharges = useMemo(
    () => charges.filter((c) => c.charge_type === "fixed" && c.order_types.includes(orderType)),
    [charges, orderType],
  );
  const additionalChargeBase = useMemo(() => {
    const total = applicableCharges.reduce((s, c) => {
      const gst = c.gst_applicable ? (c.amount * c.gst_rate) / 100 : 0;
      return s + c.amount + gst;
    }, 0);
    return Math.round(total * 100) / 100;
  }, [applicableCharges]);
  const additionalChargeName = applicableCharges.length === 1 ? applicableCharges[0].charge_head : "Additional charges";
  const additionalChargeTotal = applyAdditional ? additionalChargeBase : 0;

  // Restaurant extra packaging (take-away), gated like food GST.
  const packagingGross = orderType === "take_away" ? extraPackaging : 0;
  const packagingAmount = foodGstApplies ? Math.round(packagingGross * 100) / 100 : 0;

  // Delivery (auto): the quote drives both the fee and its GST.
  const deliveryCharge = orderType === "delivery" ? (deliveryQuote?.delivery_charge ?? 0) : 0;
  const deliveryGst = orderType === "delivery" ? (deliveryQuote?.delivery_gst ?? 0) : 0;

  // Drop-off coordinates: a saved address, or the map pin. Fall back to the map
  // when there are no saved addresses (e.g. a walk-in delivery).
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;
  const useMap = addrMode === "map" || addresses.length === 0;
  const deliveryCoords = useMemo<{ lat: string; lng: string } | null>(() => {
    if (useMap) return parsePin(mapPin);
    if (selectedAddress?.latitude && selectedAddress?.longitude) return { lat: selectedAddress.latitude, lng: selectedAddress.longitude };
    return null;
  }, [useMap, mapPin, selectedAddress]);
  const coordsKey = deliveryCoords ? `${deliveryCoords.lat},${deliveryCoords.lng}` : "";

  // Quote the delivery fee whenever the drop-off or order value changes. Retries
  // a few times because the API can be cold-starting (a single failed fetch must
  // never silently leave the fee at ₹0). `quoteFailed` distinguishes "couldn't
  // calculate" from a genuine ₹0 so the UI doesn't read a transient error as free.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (orderType !== "delivery" || !restaurantId || !coordsKey) { setDeliveryQuote(null); setQuoteFailed(false); setQuoting(false); return; }
    let cancelled = false;
    setQuoting(true);
    setQuoteFailed(false);
    const [lat, lng] = coordsKey.split(",");
    const attempt = async (n: number): Promise<void> => {
      try {
        const res = await fetch("/api/admin/pos/delivery-quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ restaurant_id: Number(restaurantId), latitude: lat, longitude: lng, order_value: couponBase }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const d = (await res.json()) as DeliveryQuote | null;
        if (cancelled) return;
        if (d && typeof d.delivery_charge === "number") { setDeliveryQuote(d); setQuoteFailed(false); setQuoting(false); return; }
        throw new Error("bad-shape");
      } catch {
        if (cancelled) return;
        if (n < 3) { setTimeout(() => { if (!cancelled) void attempt(n + 1); }, 1500 * (n + 1)); return; }
        setDeliveryQuote(null); setQuoteFailed(true); setQuoting(false);
      }
    };
    const t = setTimeout(() => { void attempt(0); }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [orderType, restaurantId, coordsKey, couponBase]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Round to paise exactly like the backend's order_amount (Math.round), so the
  // displayed total equals what is charged (toFixed alone can drift 1 paise).
  const total = Math.round(
    (taxable + vat + deliveryCharge + deliveryGst + additionalChargeTotal + packagingAmount) * 100,
  ) / 100;

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
  function pickCustomer(c: CustomerOpt) {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerPhone(c.phone.replace(/\D/g, "").slice(-10));
    setCustomerQuery("");
    setCustomerResults([]);
    setWalkIn(false);
  }
  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
    setAddresses([]);
    setSelectedAddressId(null);
  }

  function placeOrder() {
    setError(null);
    if (!restaurantId) { setError("Select a restaurant first"); return; }
    if (lines.length === 0) { setError("Cart is empty"); return; }
    if (orderType === "dine_in" && !tableNumber.trim()) { setError("Table number is required for dine in"); return; }
    if (customerPhone && !/^[6-9]\d{9}$/.test(customerPhone)) {
      setError("Enter a valid 10-digit Indian mobile number (starts with 6–9)");
      return;
    }
    if (orderType === "delivery" && !deliveryCoords) {
      setError("Pick a delivery address (saved address or a map location)");
      return;
    }
    // The backend recomputes the delivery fee on placement; block until the
    // preview has resolved so the shown total can't differ from what's charged.
    if (orderType === "delivery" && deliveryCoords && !deliveryQuote) {
      setError(quoteFailed
        ? "Couldn't calculate the delivery fee — re-select the address or try again in a moment."
        : "Delivery fee is still calculating — please wait a second.");
      return;
    }
    if (couponIneligible) {
      setError(`Coupon ${selectedCouponCode} needs a minimum order of ₹${selectedCoupon?.min_purchase}. Remove it or add items.`);
      return;
    }
    setPlacing(true);
    const usingSaved = orderType === "delivery" && !useMap && selectedAddress;
    fetch("/api/admin/pos/place-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        restaurant_id: Number(restaurantId),
        items: lines.map((l) => ({
          food_id: l.food.id, name: l.food.name, price: l.food.price, quantity: l.qty,
          add_ons: l.addOns.map((id) => ({ id, name: addOnMap[id]?.name ?? null, price: addOnMap[id]?.price ?? 0 })),
        })),
        customer_id: selectedCustomer?.id ?? undefined,
        customer_name: customerName || selectedCustomer?.name || undefined,
        customer_phone: customerPhone || undefined,
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber.trim() : undefined,
        payment_method: paymentMethod,
        coupon_code: selectedCouponCode || undefined,
        // GST applies per the admin's order-type config; the backend re-gates it.
        tax_percent: foodGstApplies ? tax : 0,
        // Delivery is computed server-side from the address / pin (auto fee).
        customer_address_id: usingSaved ? selectedAddress!.id : undefined,
        latitude: orderType === "delivery" && deliveryCoords ? deliveryCoords.lat : undefined,
        longitude: orderType === "delivery" && deliveryCoords ? deliveryCoords.lng : undefined,
        // The single Apply switch decides apply vs waive; the backend recomputes
        // the amount server-side (never trusts a client-sent charge total).
        apply_additional_charge: applyAdditional,
        extra_packaging_amount: packagingAmount,
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
          {/* Customer — pick an existing customer (enables saved-address delivery)
              or enter a walk-in by name. */}
          {selectedCustomer ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">{selectedCustomer.name}</div>
                {selectedCustomer.phone && <div className="text-xs text-slate-500">{selectedCustomer.phone}</div>}
              </div>
              <button type="button" onClick={clearCustomer} className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline">Change</button>
            </div>
          ) : walkIn ? (
            <div className="space-y-2">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer name" className={selCls} />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Phone (optional, 10-digit Indian)"
                inputMode="numeric" maxLength={10} className={selCls}
              />
              {customerPhone !== "" && !/^[6-9]\d{9}$/.test(customerPhone) && (
                <p className="text-[11px] text-rose-600">Enter a valid 10-digit Indian mobile number (starts with 6–9).</p>
              )}
              <button type="button" onClick={() => { setWalkIn(false); setCustomerName(""); setCustomerPhone(""); }} className="text-xs font-semibold text-emerald-700 hover:underline">Search an existing customer</button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-2">
                <input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Search customer by name / phone" className={selCls} />
                <button type="button" onClick={() => setWalkIn(true)} className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3">Walk-in</button>
              </div>
              {customerResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                  {customerResults.map((c) => (
                    <button key={c.id} type="button" onClick={() => pickCustomer(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-slate-50 last:border-0">
                      <span className="font-medium text-slate-800">{c.name}</span>
                      {c.phone && <span className="text-slate-400 ml-2">{c.phone}</span>}
                    </button>
                  ))}
                </div>
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
              <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table number (required)" className={`${selCls} mt-2`} />
            )}
          </div>

          {/* Delivery address — saved addresses (auto fee) or a map pin. */}
          {orderType === "delivery" && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Delivery address</span>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setAddrMode(addrMode === "saved" ? "map" : "saved")} className="text-xs font-semibold text-emerald-700 hover:underline">
                    {addrMode === "saved" ? "Use a map location" : "Use a saved address"}
                  </button>
                )}
              </div>
              {!selectedCustomer && !useMap && (
                <p className="text-[11px] text-slate-500">Select a customer to use their saved addresses, or drop a map pin below.</p>
              )}
              {!useMap && addresses.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {addresses.map((a) => (
                    <label key={a.id} className="flex items-start gap-2 text-sm cursor-pointer rounded px-1 py-1 hover:bg-slate-50">
                      <input type="radio" className="mt-0.5" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} />
                      <span className="min-w-0">
                        <span className="font-medium text-slate-700 capitalize">{a.address_type ?? "address"}</span>
                        <span className="text-slate-500"> — {a.address ?? `${a.latitude}, ${a.longitude}`}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <MapPicker value={mapPin} onChange={setMapPin} label="Drop the delivery location" />
              )}
            </div>
          )}

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
                          <button key={a.id} type="button" onClick={() => toggleAddOn(l.food.id, a.id)}
                            className={`text-[11px] px-2 py-0.5 rounded-full border transition ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"}`}>
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

          {/* Totals — auto-computed from config, mirroring the customer checkout. */}
          <div className="text-sm space-y-1">
            {addonTotal > 0 && <Row label="Addon" value={inr(addonTotal)} />}
            <Row label="Subtotal" value={inr(subtotal)} />

            {/* Coupon — restaurant-wise; the backend revalidates authoritatively. */}
            {restaurantId && coupons.length > 0 && (
              <>
                <label className="flex justify-between items-center gap-2 text-slate-600">
                  <span className="shrink-0">Coupon</span>
                  <select value={selectedCouponCode} onChange={(e) => setSelectedCouponCode(e.target.value)} className="flex-1 min-w-0 max-w-[15rem] rounded border border-slate-300 px-2 py-0.5 text-sm">
                    <option value="">No coupon</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.discount_type === "percent" || c.discount_type === "percentage" ? `${c.discount}%` : inr(c.discount)}{c.min_purchase ? ` (min ₹${c.min_purchase})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedCouponCode && !couponIneligible && (
                  <div className="flex justify-between text-emerald-700"><span>Coupon ({selectedCouponCode})</span><span className="tabular-nums">− {inr(couponDiscount)}</span></div>
                )}
                {couponIneligible && (
                  <p className="text-[11px] text-amber-600">Add {inr((selectedCoupon?.min_purchase ?? 0) - couponBase)} more to use {selectedCouponCode}.</p>
                )}
              </>
            )}

            {/* Delivery fee — auto from distance (read-only). A failed quote shows
                "couldn't calculate", never a misleading ₹0.00. The sub-line shows
                the distance + which slab priced it, so the basis is visible. */}
            {orderType === "delivery" && (
              <>
                <Row
                  label="Delivery fee"
                  value={quoting ? "calculating…" : !deliveryCoords ? "—" : quoteFailed ? "couldn’t calculate" : deliveryQuote?.free_delivery ? "Free" : inr(deliveryCharge)}
                />
                {deliveryQuote && !deliveryQuote.free_delivery && (
                  <p className="text-[11px] text-slate-500 -mt-0.5">
                    {deliveryQuote.distance_km} km
                    {deliveryQuote.slab_min_km != null && deliveryQuote.slab_max_km != null && (
                      <>
                        {" · "}
                        {deliveryQuote.priced_by === "extrapolated"
                          ? `beyond ${deliveryQuote.slab_max_km} km slab — scaled by distance`
                          : deliveryQuote.priced_by === "rounded_up"
                            ? `${deliveryQuote.slab_min_km}–${deliveryQuote.slab_max_km} km slab (rounded up)`
                            : `${deliveryQuote.slab_min_km}–${deliveryQuote.slab_max_km} km slab`}
                      </>
                    )}
                  </p>
                )}
              </>
            )}

            {/* GST — food GST + delivery GST, applied per the admin's config. */}
            {(vat > 0 || deliveryGst > 0) && <Row label={`GST (${tax}%)`} value={inr(vat + deliveryGst)} />}

            {/* The one manual control: apply / waive the configured platform fee. */}
            {additionalChargeBase > 0 && (
              <label className="flex justify-between items-center text-slate-600 cursor-pointer select-none">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={applyAdditional} onChange={(e) => setApplyAdditional(e.target.checked)} className="accent-emerald-600 cursor-pointer" />
                  <span className={applyAdditional ? "" : "line-through text-slate-400"}>{additionalChargeName}</span>
                </span>
                <span className={`tabular-nums ${applyAdditional ? "" : "line-through text-slate-400"}`}>{inr(additionalChargeBase)}</span>
              </label>
            )}

            {/* Extra packaging — applied per config (take-away). */}
            {packagingAmount > 0 && <Row label="Extra packaging" value={inr(packagingAmount)} />}

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
