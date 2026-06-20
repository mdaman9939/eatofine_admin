import { adminFetch } from "../../../lib/api";
import { SettingRow } from "../../../components/SettingRow";

interface PlatformSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  value_type: "int" | "float" | "string" | "bool" | "json";
  category: "auth" | "dm" | "promo" | "billing" | "general";
  label: string;
  description: string | null;
  min_value: number | null;
  max_value: number | null;
  updated_at: string | null;
}

type CategoryKey = PlatformSetting["category"];

interface CategoryMeta {
  key: CategoryKey;
  title: string;
  description: string;
  accent: "emerald" | "teal" | "amber" | "slate";
  icon: React.ReactNode;
}

const CATEGORY_ORDER: CategoryKey[] = ["auth", "dm", "promo", "billing", "general"];

const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  auth: {
    key: "auth",
    title: "Authentication",
    description: "OTP windows, session lifetimes, lockout thresholds, and password rules.",
    accent: "emerald",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 11c0-1.105.895-2 2-2m-2 2v3m0-3c0-1.105-.895-2-2-2m4 5h0M5 11V7a7 7 0 0114 0v4m1 0H4a1 1 0 00-1 1v8a1 1 0 001 1h16a1 1 0 001-1v-8a1 1 0 00-1-1z" />
      </svg>
    ),
  },
  dm: {
    key: "dm",
    title: "Delivery partners",
    description: "Assignment radius, shift gates, idle timeouts, and earnings rounding.",
    accent: "teal",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  promo: {
    key: "promo",
    title: "Promotions",
    description: "Approval flow, stacking rules, coupon caps, and campaign windows.",
    accent: "amber",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  billing: {
    key: "billing",
    title: "Billing",
    description: "Invoice generation cadence, settlement holds, and tax write-back behaviour.",
    accent: "emerald",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  general: {
    key: "general",
    title: "General",
    description: "Cross-cutting runtime defaults that don't fit a specific subsystem.",
    accent: "slate",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317a1 1 0 011.35 0l.835.835a1 1 0 001.32.083l.99-.66a1 1 0 011.475.555l.34 1.13a1 1 0 00.97.71h1.18a1 1 0 01.97 1.265l-.34 1.13a1 1 0 00.555 1.21l1.04.52a1 1 0 010 1.79l-1.04.52a1 1 0 00-.555 1.21l.34 1.13a1 1 0 01-.97 1.265h-1.18a1 1 0 00-.97.71l-.34 1.13a1 1 0 01-1.475.555l-.99-.66a1 1 0 00-1.32.083l-.835.835a1 1 0 01-1.35 0l-.835-.835a1 1 0 00-1.32-.083l-.99.66a1 1 0 01-1.475-.555l-.34-1.13a1 1 0 00-.97-.71H4.49a1 1 0 01-.97-1.265l.34-1.13a1 1 0 00-.555-1.21l-1.04-.52a1 1 0 010-1.79l1.04-.52a1 1 0 00.555-1.21l-.34-1.13a1 1 0 01.97-1.265h1.18a1 1 0 00.97-.71l.34-1.13a1 1 0 011.475-.555l.99.66a1 1 0 001.32-.083l.835-.835zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

const ACCENT_CLASSES: Record<CategoryMeta["accent"], { iconBg: string; iconRing: string; iconText: string; badgeBg: string; badgeText: string; badgeRing: string }> = {
  emerald: {
    iconBg: "bg-emerald-50",
    iconRing: "ring-emerald-100",
    iconText: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeRing: "ring-emerald-200",
  },
  teal: {
    iconBg: "bg-teal-50",
    iconRing: "ring-teal-100",
    iconText: "text-teal-700",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    badgeRing: "ring-teal-200",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconRing: "ring-amber-100",
    iconText: "text-amber-700",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeRing: "ring-amber-200",
  },
  slate: {
    iconBg: "bg-slate-100",
    iconRing: "ring-slate-200",
    iconText: "text-slate-700",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeRing: "ring-slate-200",
  },
};

export default async function PlatformSettingsPage() {
  const data = await adminFetch<PlatformSetting[]>("/admin/platform-settings");
  const settings = Array.isArray(data) ? data : [];

  // ── Stats ─────────────────────────────────────────────────
  const total = settings.length;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const updatedThisMonth = settings.filter((s) => {
    if (!s.updated_at) return false;
    const t = new Date(s.updated_at).getTime();
    return !Number.isNaN(t) && t >= thirtyDaysAgo;
  }).length;
  const usedCategories = new Set(settings.map((s) => s.category));
  const categoryCount = usedCategories.size;

  // ── Group by category ─────────────────────────────────────
  const grouped: Record<CategoryKey, PlatformSetting[]> = {
    auth: [],
    dm: [],
    promo: [],
    billing: [],
    general: [],
  };
  for (const s of settings) {
    if (grouped[s.category]) grouped[s.category].push(s);
  }

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Platform · Runtime configuration
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Platform settings</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Configuration registry for auth security, delivery partner behaviour, promotion approval
              flow, and billing automation. These values are stored here for reference — the live
              runtime config the backend actually reads lives in Business Settings.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Registry</div>
            <div className="text-lg font-bold tabular-nums">{total}</div>
            <div className="text-[11px] text-white/70">configuration keys</div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total settings" value={total} suffix="across all subsystems" accent="emerald" />
        <StatCard label="Updated this month" value={updatedThisMonth} suffix="in the last 30 days" accent="teal" />
        <StatCard label="Categories" value={categoryCount} suffix={`of ${CATEGORY_ORDER.length} configured`} accent="cyan" />
      </div>

      {/* ── Category cards ─────────────────────────────────────── */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const meta = CATEGORIES[cat];
        const accent = ACCENT_CLASSES[meta.accent];
        return (
          <div
            key={cat}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${accent.iconBg} ring-1 ${accent.iconRing} ${accent.iconText} flex items-center justify-center`}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-slate-900">{meta.title}</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ${accent.badgeBg} ${accent.badgeText} ring-1 ${accent.badgeRing}`}
                  >
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {items.length} {items.length === 1 ? "setting" : "settings"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((s) => (
                <SettingRow key={s.setting_key} setting={s} />
              ))}
            </div>
          </div>
        );
      })}

      {total === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 ring-1 ring-slate-200 text-slate-500 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">No platform settings yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Seed the <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">platform_settings</code> table to start configuring runtime knobs.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  accent: "emerald" | "teal" | "cyan" | "slate";
}) {
  const palette: Record<string, { text: string; bg: string }> = {
    emerald: { text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    cyan: { text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
    slate: { text: "text-slate-700", bg: "from-slate-50 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight tabular-nums ${p.text}`}>{value}</span>
      </div>
      {suffix && <div className="mt-1 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
