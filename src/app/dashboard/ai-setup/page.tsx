import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "OpenAI",
    description: "Used for AI-assisted content (food descriptions, SEO copy, etc.).",
    fields: [
      { key: "ai.enabled", label: "Enable AI features", type: "checkbox", defaultValue: "false" },
      { key: "ai.openai_api_key", label: "OpenAI API key", type: "text", placeholder: "sk-…" },
      {
        key: "ai.model", label: "Model", type: "select", defaultValue: "gpt-4o-mini",
        options: [
          { value: "gpt-4o-mini", label: "gpt-4o-mini" },
          { value: "gpt-4o", label: "gpt-4o" },
          { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
        ],
      },
      { key: "ai.max_tokens", label: "Max tokens", type: "number", defaultValue: "500" },
    ],
  },
];

export default async function AiSetupPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=ai.",
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Setup</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">OpenAI credentials for AI-assisted content generation across the panel.</p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
