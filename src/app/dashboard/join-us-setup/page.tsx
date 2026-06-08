import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Restaurant — Join us page",
    description: "Content for the public 'Become a partner restaurant' landing page.",
    fields: [
      { key: "joinus.restaurant.title", label: "Title", type: "text", defaultValue: "Grow your restaurant with Eatofine" },
      { key: "joinus.restaurant.subtitle", label: "Subtitle", type: "textarea", defaultValue: "List your restaurant and reach thousands of hungry customers." },
      { key: "joinus.restaurant.image", label: "Hero image URL", type: "url", placeholder: "/storage/join-us/restaurant.png" },
      { key: "joinus.restaurant.benefits", label: "Benefits (one per line)", type: "textarea", placeholder: "More orders\nZero setup fee\nDaily payouts" },
    ],
  },
  {
    title: "Delivery man — Join us page",
    description: "Content for the public 'Become a delivery partner' landing page.",
    fields: [
      { key: "joinus.deliveryman.title", label: "Title", type: "text", defaultValue: "Earn on your own schedule" },
      { key: "joinus.deliveryman.subtitle", label: "Subtitle", type: "textarea", defaultValue: "Deliver with Eatofine and earn flexible income." },
      { key: "joinus.deliveryman.image", label: "Hero image URL", type: "url", placeholder: "/storage/join-us/deliveryman.png" },
      { key: "joinus.deliveryman.benefits", label: "Benefits (one per line)", type: "textarea", placeholder: "Flexible hours\nWeekly payouts\nIncentives" },
    ],
  },
];

export default async function JoinUsSetupPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=joinus.",
  );
  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · 3RD PARTY
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Join Us Page Setup</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">Content for the public restaurant + delivery-man partner signup pages.</p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
