import { CreateForm, type FieldSpec } from "../../../../components/CreateForm";
import { adminFetch } from "../../../../lib/api";

interface ZonesResponse { zones: Array<{ id: number; name: string | null }> }
interface CuisinesResponse { cuisines: Array<{ id: number; name: string | null }> }

// State dropdown for the "Additional data" section (GST state).
const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export default async function AddRestaurantPage() {
  // Populate the Zone select + Cuisine multiselect from live data, the same
  // way Laravel's Add Restaurant form seeds its dropdowns.
  const [zonesRes, cuisinesRes] = await Promise.all([
    adminFetch<ZonesResponse>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<CuisinesResponse>("/admin/cuisines").catch(() => ({ cuisines: [] })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const cuisineOptions = cuisinesRes.cuisines.map((c) => ({ value: String(c.id), label: c.name ?? `Cuisine ${c.id}` }));

  const fields: FieldSpec[] = [
    // ── Restaurant info (multi-language, like StackFood) ────────────
    { name: "_h_info", label: "Restaurant information", type: "heading" },
    { name: "name", label: "Restaurant name (default)", type: "text", required: true, placeholder: "e.g. Spice Garden" },
    { name: "restaurant_phone", label: "Restaurant number", type: "text", placeholder: "e.g. +91-9876543210" },
    { name: "translations", label: "Name in other languages", type: "multilang", langKey: "name" },
    { name: "address", label: "Restaurant address (default)", type: "textarea", required: true, placeholder: "Street, city, pincode" },
    { name: "address_translations", label: "Address in other languages", type: "multilang", langKey: "address" },
    { name: "cuisine_ids", label: "Cuisines", type: "multiselect", options: cuisineOptions },
    { name: "zone_id", label: "Zone", type: "select", required: true, options: zoneOptions },

    // ── Location (set on map) ───────────────────────────────────────
    { name: "_h_loc", label: "Set location on map", type: "heading" },
    { name: "coordinates", label: "Set location on map", type: "latlng" },

    // ── Logistics / general settings ────────────────────────────────
    { name: "_h_general", label: "General settings", type: "heading" },
    { name: "restaurant_model", label: "Business model", type: "select", defaultValue: "pay_per_order", options: [
      { value: "pay_per_order", label: "Pay Per Order" },
      { value: "subscription", label: "Subscription" },
      { value: "commission", label: "Commission" },
    ] },
    { name: "minimum_order", label: "Minimum order ₹", type: "number", defaultValue: 100 },
    { name: "minimum_delivery_time", label: "Min delivery time (min)", type: "number", defaultValue: 10 },
    { name: "maximum_delivery_time", label: "Max delivery time (min)", type: "number", defaultValue: 30 },
    { name: "tax", label: "GST %", type: "number", defaultValue: 0 },
    { name: "comission", label: "Commission %", type: "number", placeholder: "Leave blank for default" },

    // ── Branding ────────────────────────────────────────────────────
    { name: "_h_brand", label: "Logo & cover", type: "heading" },
    { name: "logo", label: "Restaurant logo (1:1)", type: "image", imageDir: "restaurant" },
    { name: "cover_photo", label: "Restaurant cover", type: "image", imageDir: "restaurant/cover" },

    // ── Additional data ─────────────────────────────────────────────
    { name: "_h_additional", label: "Additional data", type: "heading" },
    { name: "identity_number", label: "Owner ID / GSTIN number", type: "text", placeholder: "Enter your ID number" },
    { name: "state", label: "State", type: "select", options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },
    { name: "license_document", label: "License document", type: "image", imageDir: "restaurant" },

    // ── Account information (owner / vendor login) ──────────────────
    { name: "_h_account", label: "Account information", type: "heading" },
    { name: "f_name", label: "Owner first name", type: "text", required: true, placeholder: "e.g. Rakesh" },
    { name: "l_name", label: "Owner last name", type: "text", placeholder: "e.g. Sharma" },
    { name: "email", label: "Email", type: "text", required: true, placeholder: "owner@restaurant.com" },
    { name: "phone", label: "Phone", type: "text", required: true, placeholder: "+91-9876543210" },
    { name: "password", label: "Password", type: "password", required: true, placeholder: "Min 8 characters" },
    { name: "confirm_password", label: "Confirm password", type: "password", required: true, placeholder: "Re-enter password" },

    // ── Capabilities ────────────────────────────────────────────────
    { name: "delivery", label: "Delivery enabled", type: "checkbox", defaultValue: true },
    { name: "take_away", label: "Takeaway enabled", type: "checkbox", defaultValue: true },
    { name: "veg", label: "Serves veg", type: "checkbox", defaultValue: true },
    { name: "non_veg", label: "Serves non-veg", type: "checkbox", defaultValue: true },
  ];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> RESTAURANT MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Restaurant</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Create the restaurant and its owner (vendor) account together — just like the Laravel admin. The owner
            can log in to the restaurant app with the email + password set here. The restaurant goes live immediately.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/restaurants"
          title="New restaurant"
          submitLabel="Create restaurant"
          embedded
          redirectTo="/dashboard/restaurants"
          fields={fields}
        />
      </div>
    </div>
  );
}
