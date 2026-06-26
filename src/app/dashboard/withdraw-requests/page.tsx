import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ActionButton } from "../../../components/ActionButton";

interface WR {
  id: number;
  vendor_id: number | null;
  delivery_man_id: number | null;
  requester_name: string | null;
  amount: number;
  approved: boolean;
  transaction_note: string | null;
  type: string;
  created_at: string | null;
}

export default async function WithdrawRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type ?? "";
  const data = await adminFetch<{ total: number; items: WR[] }>(`/admin/withdraw-requests?limit=200${type ? `&type=${type}` : ""}`);
  const heading = type === "deliveryman" ? "Deliveryman withdraw requests" : type === "restaurant" ? "Restaurant withdraw requests" : "Withdraw requests";
  return (
    <TablePage
      title={heading}
      subtitle={`${data.items.length} of ${data.total}`}
      description="Review payout requests raised by delivery men and restaurants, then approve or revoke each one before money is paid out."
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        {
          header: "Requester",
          cell: (r) => (
            <div>
              <div className="font-medium text-zinc-800">
                {r.requester_name ?? (r.vendor_id ? `Restaurant #${r.vendor_id}` : r.delivery_man_id ? `Rider #${r.delivery_man_id}` : "—")}
              </div>
              {(r.vendor_id || r.delivery_man_id) && (
                <div className="text-[10px] font-mono text-zinc-400">
                  {r.vendor_id ? `vendor #${r.vendor_id}` : `DM #${r.delivery_man_id}`}
                </div>
              )}
            </div>
          ),
        },
        { header: "Amount", cell: (r) => `₹${Number(r.amount ?? 0).toFixed(2)}` },
        { header: "Type", cell: (r) => r.type },
        { header: "Status", cell: (r) => <span className={`text-xs ${r.approved ? "text-emerald-600" : "text-amber-600"}`}>{r.approved ? "approved" : "pending"}</span> },
        { header: "Note", cell: (r) => <span className="text-xs">{r.transaction_note ?? ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
        {
          header: "Actions",
          cell: (r) => (
            <ActionButton
              path={`/withdraw-requests/${r.id}/approval`}
              method="PATCH"
              body={{ approved: !r.approved }}
              label={r.approved ? "Revoke" : "Approve"}
              variant={r.approved ? "subtle" : "primary"}
            />
          ),
        },
      ]}
    />
  );
}
