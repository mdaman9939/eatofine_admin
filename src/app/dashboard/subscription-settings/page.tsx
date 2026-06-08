import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Subscription business model",
    description: "Controls the restaurant subscription (vs commission) model.",
    fields: [
      { key: "subscription.enabled", label: "Enable subscription model", type: "checkbox", defaultValue: "true" },
      { key: "subscription.free_trial_enabled", label: "Offer free trial", type: "checkbox", defaultValue: "true" },
      { key: "subscription.free_trial_days", label: "Free trial days", type: "number", defaultValue: "14" },
      { key: "subscription.grace_period_days", label: "Grace period after expiry (days)", type: "number", defaultValue: "3" },
    ],
  },
  {
    title: "Renewal & notifications",
    fields: [
      { key: "subscription.auto_renew", label: "Auto-renew by default", type: "checkbox", defaultValue: "false" },
      { key: "subscription.notify_before_days", label: "Notify before expiry (days)", type: "number", defaultValue: "5" },
      { key: "subscription.suspend_on_expiry", label: "Suspend restaurant on expiry", type: "checkbox", defaultValue: "true" },
    ],
  },
];

export default async function SubscriptionSettingsPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=subscription.",
  );
  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · SUBSCRIPTION
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Subscription Settings</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">Trial, renewal and expiry behaviour for the restaurant subscription model.</p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
