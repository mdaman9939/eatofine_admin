import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Brand identity",
    description: "Logo, favicon, and the primary brand color that themes every accent in the app.",
    fields: [
      { key: "theme.brand_name", label: "Brand name", type: "text", defaultValue: "Eatofine", placeholder: "Eatofine" },
      { key: "theme.tagline", label: "Tagline", type: "text", defaultValue: "Food delivery service", placeholder: "Shown in admin sidebar" },
      { key: "theme.logo_url", label: "Logo URL", type: "url", placeholder: "https://… or /storage/branding/logo.png" },
      { key: "theme.favicon_url", label: "Favicon URL", type: "url", placeholder: "https://… or /storage/branding/favicon.ico" },
    ],
  },
  {
    title: "Color palette",
    description: "Pick the brand accent — buttons, links, and badges across admin + customer app re-theme automatically.",
    fields: [
      { key: "theme.primary_color", label: "Primary color", type: "color", defaultValue: "#10b981", description: "The main accent. Default = emerald-500." },
      { key: "theme.secondary_color", label: "Secondary color", type: "color", defaultValue: "#0f766e", description: "Complementary accent for gradients." },
      { key: "theme.danger_color", label: "Danger color", type: "color", defaultValue: "#e11d48", description: "Destructive actions, alerts." },
    ],
  },
  {
    title: "Sidebar style",
    description: "Admin panel sidebar appearance.",
    fields: [
      {
        key: "theme.sidebar_style", label: "Sidebar style", type: "select",
        defaultValue: "gradient",
        options: [
          { value: "gradient", label: "Gradient (default)" },
          { value: "flat", label: "Flat" },
          { value: "dark", label: "Dark mode" },
        ],
      },
      { key: "theme.sidebar_collapsed", label: "Collapsed by default", type: "checkbox", defaultValue: "false" },
    ],
  },
  {
    title: "Customer app theme",
    description: "Theming for the public customer-facing app.",
    fields: [
      { key: "theme.app_primary", label: "App primary color", type: "color", defaultValue: "#f97316", description: "Customer app accent (defaults to StackFood orange)." },
      { key: "theme.dark_mode_enabled", label: "Customer dark mode", type: "checkbox", defaultValue: "false" },
    ],
  },
];

export default async function ThemeSettingsPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=theme.",
  );

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · APPEARANCE
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Theme Settings</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Customize the brand color, logo, sidebar style, and customer-app theme. Changes save to <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">business_settings</code> and take effect on next page load.
          </p>
        </div>
      </div>

      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
