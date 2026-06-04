import { CreateForm } from "../../../../components/CreateForm";

export default function AddRestaurantPage() {
  return (
    <div className="relative p-8 space-y-6 max-w-3xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> RESTAURANT MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Restaurant</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Create a new restaurant directly (skipping public application). The restaurant becomes immediately live in the customer app.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/restaurants"
          title="New restaurant"
          submitLabel="Create restaurant"
          fields={[
            { name: "name", label: "Restaurant name", type: "text", required: true, placeholder: "e.g. Pizza Hub" },
            { name: "email", label: "Owner email", type: "text", placeholder: "owner@restaurant.com" },
            { name: "phone", label: "Contact phone", type: "text", placeholder: "+91-9876543210" },
            { name: "address", label: "Address", type: "textarea", placeholder: "Street, city, pincode" },
            { name: "minimum_order", label: "Minimum order ₹", type: "number", defaultValue: 100 },
            { name: "zone_id", label: "Zone ID", type: "number", required: true, defaultValue: 1 },
            { name: "vendor_id", label: "Vendor ID (optional)", type: "number" },
            { name: "delivery", label: "Delivery enabled", type: "checkbox", defaultValue: true },
            { name: "take_away", label: "Takeaway enabled", type: "checkbox", defaultValue: true },
          ]}
        />
      </div>
    </div>
  );
}
