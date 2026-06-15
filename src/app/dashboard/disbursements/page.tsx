import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ActionButton } from "../../../components/ActionButton";

interface D {
  id: number;
  amount: number;
  total_amount: number;
  status: string;
  recipient: string | null;
  type: string | null;
  created_at: string | null;
  initiated_at: string | null;
  paid_at: string | null;
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  disbursed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  canceled: "bg-rose-50 text-rose-700 border-rose-200",
};

export default async function DisbursementsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type ?? "";
  const data = await adminFetch<{ total: number; items: D[] }>(`/admin/disbursements?limit=100${type ? `&type=${type}` : ""}`);
  const heading = type === "deliveryman" ? "Deliveryman disbursements" : type === "restaurant" ? "Restaurant disbursements" : "Disbursements";
  const recipientHeader = type === "deliveryman" ? "Delivery man" : type === "restaurant" ? "Restaurant" : "Recipient";

  return (
    <TablePage
      title={heading}
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: recipientHeader, cell: (r) => r.recipient ?? "—" },
        { header: "Type", cell: (r) => <span className="text-xs uppercase">{r.type ?? "—"}</span> },
        { header: "Amount", cell: (r) => `₹${Number(r.amount ?? r.total_amount ?? 0).toFixed(2)}` },
        {
          header: "Status",
          cell: (r) => (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_TONE[r.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {r.status === "processing" ? "payment initiated" : r.status}
            </span>
          ),
        },
        { header: "Initiated", cell: (r) => <span className="text-xs text-zinc-500">{r.initiated_at ? fmtDate(r.initiated_at) : "—"}</span> },
        { header: "Paid", cell: (r) => <span className="text-xs text-zinc-500">{r.paid_at ? fmtDate(r.paid_at) : "—"}</span> },
        {
          header: "Actions",
          cell: (r) => (
            <span className="flex gap-1.5 flex-wrap justify-end">
              {/* Forward + reverse transitions, so admin can correct a
                  mis-clicked initiate/paid (miscommunication). */}
              {r.status === "pending" && (
                <ActionButton path={`/disbursements/${r.id}/status`} method="PATCH" body={{ status: "processing" }} label="Mark initiated" variant="primary" />
              )}
              {(r.status === "pending" || r.status === "processing") && (
                <ActionButton path={`/disbursements/${r.id}/status`} method="PATCH" body={{ status: "disbursed" }} label="Mark paid" variant="subtle" />
              )}
              {r.status === "processing" && (
                <ActionButton path={`/disbursements/${r.id}/status`} method="PATCH" body={{ status: "pending" }} label="Un-initiate" variant="subtle" confirm="Revert this payment back to not-initiated?" />
              )}
              {r.status === "disbursed" && (
                <ActionButton path={`/disbursements/${r.id}/status`} method="PATCH" body={{ status: "processing" }} label="Mark unpaid" variant="subtle" confirm="Mark this disbursement as unpaid (revert the payment)?" />
              )}
            </span>
          ),
        },
      ]}
    />
  );
}
