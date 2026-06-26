import { adminFetch } from "../../../lib/api";
import { WalletTabs, type WalletTab, type WalletRow } from "../../../components/WalletTabs";

interface WalletList {
  items: Array<WalletRow>;
  total: number;
  total_balance: number;
  holders: number;
}
interface DmPayouts {
  items: Array<{ dm_id: number; dm_name: string; phone: string | null; balance: number; collected_cash: number }>;
  total: number;
}
const EMPTY: WalletList = { items: [], total: 0, total_balance: 0, holders: 0 };
const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export default async function WalletsPage() {
  const [cust, rest, dm] = await Promise.all([
    adminFetch<WalletList>("/admin/wallets/customers").catch(() => EMPTY),
    adminFetch<WalletList>("/admin/wallets/restaurants").catch(() => EMPTY),
    adminFetch<DmPayouts>("/admin/dm-payouts").catch(() => ({ items: [], total: 0 } as DmPayouts)),
  ]);

  // DM payouts uses dm_id/dm_name — normalise to the common WalletRow shape.
  const dmItems: WalletRow[] = (dm.items ?? []).map((d) => ({
    id: Number(d.dm_id), name: d.dm_name, phone: d.phone ?? null,
    balance: r2(d.balance), collected_cash: r2(d.collected_cash),
  }));
  const dmTotal = r2(dmItems.reduce((s, d) => s + (d.balance || 0), 0));
  const dmHolders = dmItems.filter((d) => d.balance > 0).length;

  const grandTotal = r2((cust.total_balance ?? 0) + (rest.total_balance ?? 0) + dmTotal);

  const tabs: WalletTab[] = [
    { key: "customer", label: "Customer Wallets", totalBalance: cust.total_balance, holders: cust.holders, count: cust.total, rows: cust.items, extraCols: [] },
    {
      key: "restaurant", label: "Restaurant Wallets", totalBalance: rest.total_balance, holders: rest.holders, count: rest.total, rows: rest.items,
      extraCols: [{ key: "total_earning", label: "Total Earning" }, { key: "collected_cash", label: "COD Held" }],
    },
    {
      key: "delivery", label: "Delivery Men Wallets", totalBalance: dmTotal, holders: dmHolders, count: dmItems.length, rows: dmItems,
      extraCols: [{ key: "collected_cash", label: "COD Held" }],
    },
  ];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> FINANCIAL · WALLETS
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Wallets</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Every wallet balance across the three apps in one place — switch tabs for
              <strong> Customer</strong>, <strong>Restaurant</strong> and <strong>Delivery&nbsp;Man</strong> wallets.
              Each tab shows how much is held in total, how many accounts hold a balance, and the per-account breakdown.
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold">Total held (all apps)</div>
            <div className="text-3xl font-bold tracking-tight tabular-nums">₹{grandTotal.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      <WalletTabs tabs={tabs} />
    </div>
  );
}
