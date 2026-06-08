import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Analytics & tracking",
    description: "IDs and scripts injected into the public web app for marketing analytics.",
    fields: [
      { key: "analytics.ga_enabled", label: "Enable analytics", type: "checkbox", defaultValue: "false" },
      { key: "analytics.ga_measurement_id", label: "Google Analytics ID", type: "text", placeholder: "G-XXXXXXX" },
      { key: "analytics.gtm_id", label: "Google Tag Manager ID", type: "text", placeholder: "GTM-XXXXXX" },
      { key: "analytics.fb_pixel_id", label: "Facebook Pixel ID", type: "text", placeholder: "1234567890" },
      { key: "analytics.tiktok_pixel_id", label: "TikTok Pixel ID", type: "text" },
    ],
  },
  {
    title: "Custom scripts",
    description: "Raw scripts injected into the page head / body (use with care).",
    fields: [
      { key: "analytics.head_script", label: "Head script", type: "textarea", placeholder: "<script>…</script>" },
      { key: "analytics.body_script", label: "Body script", type: "textarea", placeholder: "<script>…</script>" },
    ],
  },
];

export default async function AnalyticsScriptPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=analytics.",
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Analytics Script</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">Marketing analytics IDs and custom tracking scripts for the public web app.</p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
