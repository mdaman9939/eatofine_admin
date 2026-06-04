import { CreateForm } from "../../../../components/CreateForm";

export default function AddDeliveryManPage() {
  return (
    <div className="relative p-8 space-y-6 max-w-3xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Delivery Man</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Onboard a new delivery man directly (skipping public signup). They&apos;ll be approved + login-ready immediately.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/delivery-men"
          title="New delivery man"
          submitLabel="Add delivery man"
          fields={[
            { name: "f_name", label: "First name", type: "text", required: true, placeholder: "e.g. Rajesh" },
            { name: "l_name", label: "Last name", type: "text", placeholder: "Kumar" },
            { name: "email", label: "Email", type: "text", placeholder: "rajesh@delivery.demo" },
            { name: "phone", label: "Phone", type: "text", required: true, placeholder: "+919999900001" },
            { name: "password", label: "Password (default: 12345678)", type: "text", placeholder: "Leave blank for default" },
            { name: "zone_id", label: "Zone ID", type: "number", required: true, defaultValue: 1 },
            { name: "vehicle_id", label: "Vehicle category ID", type: "number", defaultValue: 1 },
          ]}
        />
      </div>
    </div>
  );
}
