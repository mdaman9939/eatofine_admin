import { adminFetch } from "../../../lib/api";
import { TablePage, fmtMoney, fmtDate } from "../../../components/TablePage";

interface E {
  id: number;
  delivery_man_id: number | null;
  dm_name: string | null;
  amount: number;
  method: string | null;
  ref: string | null;
  created_at: string | null;
}

const CHANNEL: Record<string, { label: string; tone: string }> = {
  delivery: { label: "Delivery fee", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  tip: { label: "Tip", tone: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  bonus: { label: "Bonus", tone: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default async function DMEarningsPage() {
  const data = await adminFetch<{ total: number; items: E[] }>("/admin/dm-earnings?limit=200");
  return (
    <TablePage
      title="DM earnings"
      subtitle={`${data.items.length} of ${data.total} · live wallet credits (delivery + tips + bonuses)`}
      rows={data.items}
      rowKey={(r) => r.id}
      getSearchText={(r) => `${r.dm_name ?? ""} #${r.delivery_man_id ?? ""} ${r.method ?? ""} ${r.ref ?? ""}`.toLowerCase()}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Delivery man", cell: (r) => r.dm_name ?? (r.delivery_man_id ? `#${r.delivery_man_id}` : "—") },
        { header: "Amount", cell: (r) => <span className="font-semibold text-emerald-700">+ {fmtMoney(r.amount)}</span> },
        {
          header: "Channel",
          cell: (r) => {
            const c = CHANNEL[r.method ?? ""] ?? { label: r.method ?? "—", tone: "bg-slate-100 text-slate-600 border-slate-200" };
            return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${c.tone}`}>{c.label}</span>;
          },
        },
        { header: "Ref", cell: (r) => <span className="text-xs text-zinc-500">{r.ref ?? ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
