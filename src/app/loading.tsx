export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center sidebar-gradient text-white">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm text-white/80 tracking-wide uppercase font-semibold">Loading…</p>
      </div>
    </div>
  );
}
