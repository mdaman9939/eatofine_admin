import { adminFetch } from "../../../lib/api";
import { SettingsEditor } from "../../../components/SettingsEditor";

interface Setting {
  id: number;
  key: string;
  value: string | null;
}

export default async function BusinessSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ prefix?: string }>;
}) {
  const sp = await searchParams;
  const prefix = sp.prefix ?? "";
  const data = await adminFetch<{ settings: Setting[] }>(
    `/admin/business-settings${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`,
  );

  const filledCount = data.settings.filter((s) => s.value !== null && s.value !== "").length;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              System · Configuration
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Business settings</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              View and edit the platform&apos;s core configuration values in one place — search by name to quickly find and update a specific setting.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">{prefix ? `Prefix “${prefix}”` : "All settings"}</div>
            <div className="text-lg font-bold tabular-nums">{data.settings.length}</div>
            <div className="text-[11px] text-white/70">{filledCount} have values</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <form action="" className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <input
              name="prefix"
              defaultValue={prefix}
              placeholder="Filter by key prefix (e.g. fcm, sms, app)"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all"
          >
            Apply filter
          </button>
          {prefix && (
            <a
              href="?"
              className="cursor-pointer inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            >
              Clear
            </a>
          )}
        </form>
      </div>

      <SettingsEditor initial={data.settings} />
    </div>
  );
}
