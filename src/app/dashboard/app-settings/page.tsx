import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Customer App",
    description: "Mobile app version pinning + store URLs for end customers.",
    fields: [
      { key: "app.customer.current_version", label: "Current version", type: "text", defaultValue: "9.0", placeholder: "9.0" },
      { key: "app.customer.min_supported_version", label: "Minimum supported version", type: "text", defaultValue: "8.5", description: "Clients below this see a force-update screen." },
      { key: "app.customer.play_store_url", label: "Play Store URL", type: "url", placeholder: "https://play.google.com/store/apps/details?id=…" },
      { key: "app.customer.app_store_url", label: "App Store URL", type: "url", placeholder: "https://apps.apple.com/app/…" },
      { key: "app.customer.maintenance_mode", label: "Maintenance mode", type: "checkbox", defaultValue: "false", description: "Take the customer app offline temporarily." },
    ],
  },
  {
    title: "Restaurant App (Vendor)",
    description: "Same controls for the restaurant-owner facing app.",
    fields: [
      { key: "app.vendor.current_version", label: "Current version", type: "text", defaultValue: "9.0" },
      { key: "app.vendor.min_supported_version", label: "Minimum supported version", type: "text", defaultValue: "8.0" },
      { key: "app.vendor.play_store_url", label: "Play Store URL", type: "url" },
      { key: "app.vendor.app_store_url", label: "App Store URL", type: "url" },
      { key: "app.vendor.maintenance_mode", label: "Maintenance mode", type: "checkbox", defaultValue: "false" },
    ],
  },
  {
    title: "Delivery Man App",
    description: "Version + maintenance controls for the rider app.",
    fields: [
      { key: "app.dm.current_version", label: "Current version", type: "text", defaultValue: "9.0" },
      { key: "app.dm.min_supported_version", label: "Minimum supported version", type: "text", defaultValue: "8.0" },
      { key: "app.dm.play_store_url", label: "Play Store URL", type: "url" },
      { key: "app.dm.app_store_url", label: "App Store URL", type: "url" },
      { key: "app.dm.maintenance_mode", label: "Maintenance mode", type: "checkbox", defaultValue: "false" },
    ],
  },
  {
    title: "Web (Customer Site)",
    description: "Public marketing + ordering site.",
    fields: [
      { key: "app.web.base_url", label: "Public site URL", type: "url", placeholder: "https://eatofine.com" },
      { key: "app.web.maintenance_mode", label: "Web maintenance mode", type: "checkbox", defaultValue: "false" },
      { key: "app.web.maintenance_message", label: "Maintenance message", type: "textarea", placeholder: "We'll be back soon. Sorry for the inconvenience." },
    ],
  },
];

export default async function AppSettingsPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=app.",
  );

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · MOBILE APPS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">App &amp; Web Settings</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Pin mobile app versions, set store URLs, and toggle maintenance mode per app. Useful for cutting off old buggy clients without a new store release.
          </p>
        </div>
      </div>

      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
