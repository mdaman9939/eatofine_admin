import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Installed addons",
    description: "Toggle optional modules. Disabled addons hide from the sidebar and their endpoints return 404.",
    fields: [
      { key: "addon.subscription.enabled", label: "Subscription module", type: "checkbox", defaultValue: "true", description: "Restaurant subscription packages + recurring billing." },
      { key: "addon.subscription.version", label: "Version", type: "text", defaultValue: "1.2.0" },
      { key: "addon.loyalty.enabled", label: "Loyalty points", type: "checkbox", defaultValue: "true", description: "Earn / redeem points · tier-based rewards." },
      { key: "addon.loyalty.version", label: "Version", type: "text", defaultValue: "1.0.4" },
      { key: "addon.openai.enabled", label: "OpenAI integration", type: "checkbox", defaultValue: "false", description: "AI food descriptions + reply suggestions." },
      { key: "addon.openai.version", label: "Version", type: "text", defaultValue: "0.9.1" },
      { key: "addon.multi_currency.enabled", label: "Multi-currency", type: "checkbox", defaultValue: "false", description: "Show prices in customer's local currency." },
      { key: "addon.multi_currency.version", label: "Version", type: "text", defaultValue: "1.1.0" },
      { key: "addon.advanced_tax.enabled", label: "Advanced tax module", type: "checkbox", defaultValue: "true", description: "Country-specific tax engines (US, EU, IN)." },
      { key: "addon.referral.enabled", label: "Referral program", type: "checkbox", defaultValue: "false", description: "Refer-and-earn for customers + DMs." },
      { key: "addon.gift_cards.enabled", label: "Gift cards", type: "checkbox", defaultValue: "false", description: "Sell + redeem gift cards." },
      { key: "addon.tipping.enabled", label: "Tipping", type: "checkbox", defaultValue: "true", description: "Customers can tip the delivery man." },
    ],
  },
  {
    title: "License",
    description: "Software license tracking (for white-label deployments).",
    fields: [
      { key: "addon.license.key", label: "License key", type: "text", placeholder: "XXXX-XXXX-XXXX-XXXX" },
      { key: "addon.license.purchased_for", label: "Purchased for", type: "text", placeholder: "Company / Domain" },
      { key: "addon.license.expires_at", label: "Expires on (YYYY-MM-DD)", type: "text", placeholder: "2027-12-31" },
    ],
  },
];

export default async function SystemAddonsPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=addon.",
  );

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · ADDONS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">System Addons</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Enable / disable optional modules. Acts as a feature flag console — toggle without redeploying.
          </p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
