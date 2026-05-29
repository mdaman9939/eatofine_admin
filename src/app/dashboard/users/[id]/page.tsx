import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { ToggleStatusButton } from "../../../../components/ActionButton";

interface UserDetail {
  user: {
    id: number;
    f_name: string | null;
    l_name: string | null;
    email: string | null;
    phone: string | null;
    status: boolean | null;
    is_phone_verified: boolean | null;
    is_email_verified: boolean | null;
    login_medium: string | null;
    created_at: string | null;
  };
  stats: { order_count: number; total_spend: number };
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await adminFetch<UserDetail>(`/admin/users/${id}`);
  const u = data.user;

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/users" className="text-sm text-orange-600 hover:underline">
        ← All customers
      </Link>
      <div className="mt-2 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {`${u.f_name ?? ""} ${u.l_name ?? ""}`.trim() || `User #${u.id}`}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            #{u.id} · joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
          </p>
        </div>
        <ToggleStatusButton basePath="/users" id={u.id} currentStatus={!!u.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Stat label="Orders" value={data.stats.order_count} />
        <Stat label="Total spend" value={`₹${data.stats.total_spend.toLocaleString("en-IN")}`} />
      </div>

      <div className="mt-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Profile</h2>
        <dl className="text-sm space-y-1">
          <Row label="Email" value={u.email} suffix={u.is_email_verified ? "verified" : null} />
          <Row label="Phone" value={u.phone} suffix={u.is_phone_verified ? "verified" : null} />
          <Row label="Login method" value={u.login_medium ?? "manual"} />
          <Row label="Status" value={u.status ? "active" : "blocked"} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value, suffix }: { label: string; value: string | number | null | undefined; suffix?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-800 dark:text-zinc-100">
        {value ?? "—"} {suffix && <span className="text-xs text-emerald-600 ml-2">({suffix})</span>}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
