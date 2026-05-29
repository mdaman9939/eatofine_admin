import Link from "next/link";
import { adminFetch } from "../../../../lib/api";

interface Invoice {
  invoice_no: string;
  issued_on: string | null;
  bill_from: { name: string; address: string; gstin: string; state: string; state_code: string };
  bill_to: { name: string; email: string | null; phone: string | null; address: string | null };
  items: Array<{ id: number; name: string; hsn: string; qty: number; unit_price: number; subtotal: number; tax: number }>;
  summary: { subtotal: number; delivery_charge: number; tax_total: number; cgst: number; sgst: number; igst: number; grand_total: number };
  payment_method: string | null;
  payment_status: string;
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await adminFetch<Invoice>(`/admin/invoices/${id}`);

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline">
        ← All invoices
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-8 mt-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="text-2xl font-bold text-blue-600">Eatofine</div>
            <div className="text-xs text-slate-500 mt-1">Tax invoice (BRD §5.2)</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">Invoice number</div>
            <div className="text-lg font-mono font-bold text-slate-800">{inv.invoice_no}</div>
            <div className="text-xs text-slate-500 mt-1">Issued {inv.issued_on ? new Date(inv.issued_on).toLocaleDateString() : "—"}</div>
          </div>
        </div>

        {/* Bill from / to */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Bill from</div>
            <div className="font-semibold text-slate-800">{inv.bill_from.name}</div>
            <div className="text-sm text-slate-600">{inv.bill_from.address}</div>
            <div className="text-xs text-slate-500 mt-1">GSTIN: <span className="font-mono">{inv.bill_from.gstin}</span></div>
            <div className="text-xs text-slate-500">State: {inv.bill_from.state} ({inv.bill_from.state_code})</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Bill to</div>
            <div className="font-semibold text-slate-800">{inv.bill_to.name}</div>
            <div className="text-sm text-slate-600">{inv.bill_to.email}</div>
            <div className="text-sm text-slate-600">{inv.bill_to.phone}</div>
            <div className="text-xs text-slate-500 mt-1">{inv.bill_to.address}</div>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-4">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">HSN/SAC</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2 text-right">Unit ₹</th>
              <th className="px-3 py-2 text-right">Subtotal ₹</th>
              <th className="px-3 py-2 text-right">Tax ₹</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inv.items.map((it, idx) => (
              <tr key={it.id}>
                <td className="px-3 py-2 font-mono text-slate-500">{idx + 1}</td>
                <td className="px-3 py-2">{it.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{it.hsn}</td>
                <td className="px-3 py-2">{it.qty}</td>
                <td className="px-3 py-2 text-right">{it.unit_price.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{it.subtotal.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{it.tax.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end">
          <div className="w-80 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>₹{inv.summary.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Delivery charge</span><span>₹{inv.summary.delivery_charge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">CGST</span><span>₹{inv.summary.cgst.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">SGST</span><span>₹{inv.summary.sgst.toFixed(2)}</span></div>
            {inv.summary.igst > 0 && <div className="flex justify-between"><span className="text-slate-600">IGST</span><span>₹{inv.summary.igst.toFixed(2)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 font-bold text-base text-slate-800">
              <span>Grand total</span>
              <span>₹{inv.summary.grand_total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-3">
              Payment: {inv.payment_method ?? "—"} · <span className="text-emerald-600 font-semibold uppercase">{inv.payment_status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-3 italic">
        BRD §5.2.3: PDF generation + email queue + cron triggers are scheduled for Week 2 Day 2.
      </div>
    </div>
  );
}
