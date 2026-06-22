import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

interface Setting {
  id: number;
  key: string;
  value: string | null;
}

const GROUPS: FieldGroup[] = [
  {
    title: "Handover & delivery completion",
    description:
      "Controls what the restaurant / delivery apps require to mark an order delivered or handed over.",
    fields: [
      {
        key: "order_delivery_verification",
        label: "Require handover / delivery OTP",
        type: "checkbox",
        defaultValue: "false",
        description:
          "When ON, the restaurant/rider must enter a 4-digit OTP from the customer to complete an order. There is no SMS gateway wired in this deployment, so walk-in / POS / take-away orders have no OTP to enter and get stuck. Keep this OFF unless you have wired real OTP delivery.",
      },
      {
        key: "order_confirmation_model",
        label: "Who confirms delivery orders",
        type: "select",
        defaultValue: "restaurant",
        description:
          "Which side confirms a new home-delivery order. 'restaurant' shows pending delivery orders in the restaurant app immediately.",
        options: [
          { value: "restaurant", label: "Restaurant" },
          { value: "deliveryman", label: "Delivery man" },
        ],
      },
    ],
  },
  {
    title: "Take Away & Dine In charges",
    description:
      "By default GST and the platform / convenience / packaging / extra-packaging charges are taken on Home Delivery only. Turn this ON to also charge them on Take Away & Dine In orders. Applies to the customer app, admin POS, and placed orders.",
    fields: [
      {
        key: "charges_on_takeaway_dinein",
        label: "Charge GST & fees on Take Away / Dine In",
        type: "checkbox",
        defaultValue: "false",
        description:
          "OFF (default): Take Away & Dine In are billed the food subtotal only — no GST, platform, convenience, packaging or extra-packaging charge. ON: those charges apply to Take Away & Dine In just like Home Delivery.",
      },
    ],
  },
  {
    title: "Cancellation permissions",
    description: "Who is allowed to cancel an in-progress order from their app.",
    fields: [
      {
        key: "canceled_by_restaurant",
        label: "Restaurant can cancel orders",
        type: "checkbox",
        defaultValue: "true",
      },
      {
        key: "canceled_by_deliveryman",
        label: "Delivery man can cancel orders",
        type: "checkbox",
        defaultValue: "false",
      },
    ],
  },
];

export default async function OrderSettingsPage() {
  // Pull just the order-handling keys this page edits.
  const keys = [
    "order_delivery_verification",
    "order_confirmation_model",
    "charges_on_takeaway_dinein",
    "canceled_by_restaurant",
    "canceled_by_deliveryman",
  ];
  const results = await Promise.all(
    keys.map((k) => adminFetch<{ settings: Setting[] }>(`/admin/business-settings?prefix=${encodeURIComponent(k)}`)),
  );
  const settings = results.flatMap((r) => r.settings).filter((s) => keys.includes(s.key));

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> Orders · Fulfilment
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Order Settings</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Handover/delivery completion rules and cancellation permissions. Turn off the OTP requirement here if your
            restaurants are getting stuck on “Enter OTP” for walk-in / POS orders.
          </p>
        </div>
      </div>

      <SettingsForm initial={settings} groups={GROUPS} />
    </div>
  );
}
