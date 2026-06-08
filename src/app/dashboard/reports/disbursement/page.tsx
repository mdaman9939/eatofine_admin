import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

interface Disbursement {
  id: number;
  recipient: string | null;
  type: string | null;
  amount: number;
  status: string;
  created_at: string | null;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default async function DisbursementReportPage() {
  let rows: Disbursement[] = [];
  try {
    const data = await adminFetch<{ items: Disbursement[] }>("/admin/disbursements?limit=100");
    rows = data.items ?? [];
  } catch { /* empty */ }

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const completed = rows.filter((r) => r.status === "completed" || r.status === "disbursed").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Disbursement Report"
      description="History of payouts to restaurants and delivery men. Status, amount, recipient."
      stats={[
        { label: "Total disbursements", value: rows.length.toString(), accent: "blue" },
        { label: "Total paid out", value: inr(total), accent: "emerald" },
        { label: "Completed", value: completed.toString(), accent: "amber" },
        { label: "Pending", value: pending.toString(), accent: "rose" },
      ]}
      detailsTitle="Disbursement details"
      columns={[
        { key: "id", label: "#" },
        { key: "recipient", label: "Recipient" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "status", label: "Status" },
        { key: "date", label: "Date" },
      ]}
      rows={rows.map((r) => ({
        id: r.id,
        recipient: r.recipient ?? "—",
        type: r.type ?? "—",
        amount: inr(Number(r.amount) || 0),
        status: r.status,
        date: fmtDate(r.created_at),
      }))}
    />
  );
}
