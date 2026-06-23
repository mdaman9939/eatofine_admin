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
  rider_available: number | null;
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
      description="Track and process money payouts to delivery men and restaurants — generate payouts, mark them as initiated or paid, and cancel ones that should not go out."
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      actions={
        type === "deliveryman" ? (
          <ActionButton
            path="/disbursements/generate"
            method="POST"
            body={{}}
            label="Generate payouts"
            variant="primary"
            confirm="Create a pending payout for every rider with a positive withdrawable balance? Their available funds get reserved, then 'Mark paid' debits the wallet."
          />
        ) : undefined
      }
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: recipientHeader, cell: (r) => r.recipient ?? "—" },
        { header: "Type", cell: (r) => <span className="text-xs uppercase">{r.type ?? "—"}</span> },
        {
          header: "Amount",
          cell: (r) => {
            const amt = Number(r.amount ?? r.total_amount ?? 0);
            const wallet = r.rider_available;
            // A pending/processing row whose amount the wallet can't back is an
            // unbacked/legacy row — flag it so the admin cancels instead of paying.
            const short = wallet != null && wallet < amt && (r.status === "pending" || r.status === "processing");
            return (
              <div>
                <div className="font-semibold">₹{amt.toFixed(2)}</div>
                {r.type === "deliveryman" && wallet != null && (
                  <div className={`text-[11px] ${short ? "text-rose-600" : "text-slate-400"}`}>
                    wallet covers ₹{wallet.toFixed(2)}{short ? " — unbacked, cancel" : ""}
                  </div>
                )}
              </div>
            );
          },
        },
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
              {(r.status === "pending" || r.status === "processing") && (
                <ActionButton path={`/disbursements/${r.id}/status`} method="PATCH" body={{ status: "canceled" }} label="Cancel" variant="danger" confirm="Cancel this payout row? For a generated payout this releases the reserved funds back to the rider's available balance. Legacy rows are just voided." />
              )}
            </span>
          ),
        },
      ]}
    />
  );
}
