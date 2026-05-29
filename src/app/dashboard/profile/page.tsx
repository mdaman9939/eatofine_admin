import { adminFetch } from "../../../lib/api";
import { ProfileEditor } from "../../../components/ProfileEditor";

interface Admin {
  id: number;
  f_name: string | null;
  l_name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role_id: number | null;
  zone_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export default async function ProfilePage() {
  const me = await adminFetch<Admin>("/admin/me");
  const fullName = [me.f_name, me.l_name].filter(Boolean).join(" ") || "Administrator";

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {initials(fullName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Account · Administrator
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{fullName}</h1>
            <p className="mt-1 text-sm text-white/80">{me.email}</p>
            <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-white/80">
              {me.role_id !== null && (
                <span className="bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-2 py-0.5 rounded-md">Role #{me.role_id}</span>
              )}
              {me.zone_id !== null && (
                <span className="bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-2 py-0.5 rounded-md">Zone #{me.zone_id}</span>
              )}
              {me.phone && (
                <span className="bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-2 py-0.5 rounded-md font-mono">{me.phone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileEditor initial={me} />
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
