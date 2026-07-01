import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { ToggleStatusButton } from "../../../../components/ActionButton";
import { PaginatedTable } from "../../../../components/PaginatedTable";

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
  stats: {
    order_count: number;
    total_spend: number;
    wallet_balance?: number;
    avg_order_value?: number;
    breakdown?: { delivered: number; ongoing: number; canceled: number; refunded: number };
  };
  addresses?: Array<{ id: number; address_type: string | null; address: string | null; contact_person_name: string | null; contact_person_number: string | null }>;
  recent_orders?: Array<{ id: number; order_amount: number; order_status: string | null; payment_status: string | null; created_at: string | null }>;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Walk-in / POS orders carry a placeholder customer id of 0 (no real account).
  // Fetching it 404s — render a friendly card instead of crashing the panel.
  let data: UserDetail | null = null;
  try {
    data = await adminFetch<UserDetail>(`/admin/users/${id}`);
  } catch {
    data = null;
  }
  if (!data || !data.user) {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/dashboard/users" className="text-sm text-orange-600 hover:underline">← All customers</Link>
        <div className="mt-6 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
          <h1 className="text-lg font-semibold">Customer not found</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {String(id) === "0"
              ? "This was a walk-in / POS order with no registered customer account."
              : "This customer record does not exist or has been removed."}
          </p>
        </div>
      </div>
    );
  }
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

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Orders" value={data.stats.order_count} />
        <Stat label="Total spend" value={`₹${data.stats.total_spend.toLocaleString("en-IN")}`} />
        <Stat label="Avg order" value={`₹${Math.round(data.stats.avg_order_value ?? 0).toLocaleString("en-IN")}`} />
        <Stat label="Wallet" value={`₹${(data.stats.wallet_balance ?? 0).toLocaleString("en-IN")}`} />
      </div>

      {data.stats.breakdown && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          <MiniStat label="Delivered" value={data.stats.breakdown.delivered} color="text-emerald-600" />
          <MiniStat label="Ongoing" value={data.stats.breakdown.ongoing} color="text-amber-600" />
          <MiniStat label="Canceled" value={data.stats.breakdown.canceled} color="text-slate-500" />
          <MiniStat label="Refunded" value={data.stats.breakdown.refunded} color="text-rose-600" />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Profile</h2>
          <dl className="text-sm space-y-1">
            <Row label="Email" value={u.email} suffix={u.is_email_verified ? "verified" : null} />
            <Row label="Phone" value={u.phone} suffix={u.is_phone_verified ? "verified" : null} />
            <Row label="Login method" value={u.login_medium ?? "manual"} />
            <Row label="Status" value={u.status ? "active" : "blocked"} />
          </dl>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-3">Addresses</h2>
          {data.addresses?.length ? (
            <ul className="text-sm space-y-2">
              {data.addresses.map((a) => (
                <li key={a.id} className="border-b border-zinc-100 dark:border-zinc-700 pb-2 last:border-0">
                  <span className="inline-block text-[10px] uppercase font-semibold text-emerald-600 mr-2">{a.address_type ?? "address"}</span>
                  {a.address ?? "—"}
                  {a.contact_person_number && <span className="block text-xs text-zinc-500">{a.contact_person_name} · {a.contact_person_number}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">No saved addresses.</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recent orders</h2>
        <PaginatedTable
          searchable
          pageSize={10}
          colCount={5}
          empty="No orders yet."
          searchTexts={(data.recent_orders ?? []).map((o) => `#${o.id} ${o.order_status ?? ""} ${o.payment_status ?? ""}`.toLowerCase())}
          headerRow={
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-right">Date</th>
            </tr>
          }
          bodyRows={(data.recent_orders ?? []).map((o) => (
            <tr key={o.id} className="hover:bg-emerald-50/40">
              <td className="px-4 py-2.5"><Link href={`/dashboard/orders/${o.id}`} className="text-emerald-700 hover:underline font-mono">#{o.id}</Link></td>
              <td className="px-4 py-2.5 text-xs">{o.order_status ?? "—"}</td>
              <td className="px-4 py-2.5 text-xs text-zinc-500">{o.payment_status ?? "—"}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">₹{o.order_amount.toLocaleString("en-IN")}</td>
              <td className="px-4 py-2.5 text-right text-xs text-zinc-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 text-center">
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] uppercase text-zinc-500">{label}</div>
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
