import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Beta features",
    description: "Experimental modules — enable for a subset of users before going full rollout.",
    fields: [
      { key: "flag.dispatch_v2.enabled", label: "Dispatch v2 (AI-powered)", type: "checkbox", defaultValue: "false", description: "Smarter DM auto-assignment using order density." },
      { key: "flag.dispatch_v2.rollout_percent", label: "Rollout % of orders", type: "number", defaultValue: "10", placeholder: "10" },
      { key: "flag.smart_pricing.enabled", label: "Smart pricing (surge)", type: "checkbox", defaultValue: "false", description: "Dynamic per-km charge during peak hours." },
      { key: "flag.smart_pricing.rollout_percent", label: "Rollout % of zones", type: "number", defaultValue: "0" },
      { key: "flag.ai_recommendations.enabled", label: "AI recommendations", type: "checkbox", defaultValue: "false", description: "Personalized food recs in customer app home." },
    ],
  },
  {
    title: "Stable features (gradual rollout)",
    fields: [
      { key: "flag.contactless_delivery.enabled", label: "Contactless delivery", type: "checkbox", defaultValue: "true" },
      { key: "flag.scheduled_orders.enabled", label: "Scheduled / pre-orders", type: "checkbox", defaultValue: "true" },
      { key: "flag.group_orders.enabled", label: "Group orders", type: "checkbox", defaultValue: "false", description: "Multiple customers add to one cart." },
      { key: "flag.dine_in.enabled", label: "Dine-in orders", type: "checkbox", defaultValue: "true" },
      { key: "flag.takeaway.enabled", label: "Takeaway / self-pickup", type: "checkbox", defaultValue: "true" },
      { key: "flag.partial_payment.enabled", label: "Partial payment (wallet + COD)", type: "checkbox", defaultValue: "true" },
      { key: "flag.guest_checkout.enabled", label: "Guest checkout", type: "checkbox", defaultValue: "true", description: "Order without creating an account." },
    ],
  },
  {
    title: "Targeted rollout",
    description: "Restrict rollout to specific cohorts (zones or customer IDs).",
    fields: [
      { key: "flag.targeted_zones", label: "Limit to zones (CSV of IDs)", type: "text", placeholder: "1,2,3" },
      { key: "flag.beta_users", label: "Beta user IDs (CSV)", type: "text", placeholder: "1,42,100" },
    ],
  },
];

export default async function AddonActivationPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=flag.",
  );

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · FEATURE FLAGS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Addon Activation (Feature Flags)</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Enable / disable optional features without a redeploy. Percentage rollout supported for safe canary launches.
          </p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
