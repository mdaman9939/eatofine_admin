import { CleanDatabaseForm } from "./CleanDatabaseForm";

export default function CleanDatabasePage() {
  return (
    <div className="relative p-8 space-y-6 w-full">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-700 to-rose-900 text-white shadow-xl ring-1 ring-rose-300/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,165,165,0.35),transparent_55%)]" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-rose-100/80 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-rose-100/80" /> SYSTEM · DANGER ZONE
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Clean Database</h1>
          <p className="mt-2 text-sm text-rose-100/90 leading-relaxed max-w-3xl">
            Truncate dummy / demo data sets before going live. Each toggle clears one collection. Irreversible — confirm with the typed phrase &quot;DELETE&quot;.
          </p>
        </div>
      </div>

      <CleanDatabaseForm />
    </div>
  );
}
