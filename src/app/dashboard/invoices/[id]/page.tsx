import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { PrintButton } from "./PrintButton";

interface Invoice {
  invoice_no: string;
  issued_on: string | null;
  bill_from: { name: string; address: string; gstin: string; state: string; state_code: string };
  bill_to: { name: string; email: string | null; phone: string | null; address: string | { address?: string; formatted?: string } | null };
  items: Array<{ id: number; name: string; hsn: string; qty: number; unit_price: number; subtotal: number; tax: number }>;
  summary: { subtotal: number; delivery_charge: number; tax_total: number; cgst: number; sgst: number; igst: number; grand_total: number };
  payment_method: string | null;
  payment_status: string;
}

// ── Eatofine company defaults — used as fallback when business_settings
//    hasn't been customized yet. Admin can override every field from
//    /dashboard/invoice-setup and the change reflects on every invoice. ──
const EATOFINE_DEFAULTS = {
  legal_name: "Eatofine Delivery Service Pvt. Ltd.",
  short_name: "EATOFINE",
  registered_office: ". FF2, Vishnu Palace, Sec 20B, Faridabad NIT, Faridabad, Haryana, India, 121001, India",
  state: "Haryana",
  state_code: "06",
  cin: "U56103HR2025PTC131940",
  gstin: "06ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  fssai: "10024051234567",
  email: "eatofine@gmail.com",
  website: "www.eatofine.com",
  footer_note: "This is a computer generated document. No signature required.",
};

/** Read company-identity fields from `invoice.*` settings, falling back to
 *  the defaults above. Wired live so updates in /dashboard/invoice-setup
 *  immediately reflect on every invoice render. */
async function loadEatofineSettings() {
  try {
    const data = await adminFetch<{ settings: Array<{ key: string; value: string | null }> }>(
      "/admin/business-settings?prefix=invoice.",
    );
    const map = new Map(data.settings.map((s) => [s.key, s.value]));
    const pick = (key: string, fallback: string) => {
      const v = map.get(`invoice.${key}`);
      return v && v.trim() !== "" ? v : fallback;
    };
    return {
      legal_name: pick("company_name", EATOFINE_DEFAULTS.legal_name),
      short_name: pick("short_name", EATOFINE_DEFAULTS.short_name),
      registered_office: pick("registered_office", EATOFINE_DEFAULTS.registered_office),
      state: pick("state", EATOFINE_DEFAULTS.state),
      state_code: pick("state_code", EATOFINE_DEFAULTS.state_code),
      cin: pick("cin", EATOFINE_DEFAULTS.cin),
      gstin: pick("gstin", EATOFINE_DEFAULTS.gstin),
      pan: pick("pan", EATOFINE_DEFAULTS.pan),
      fssai: pick("fssai", EATOFINE_DEFAULTS.fssai),
      email: pick("email", EATOFINE_DEFAULTS.email),
      website: pick("website", EATOFINE_DEFAULTS.website),
      footer_note: pick("footer_note", EATOFINE_DEFAULTS.footer_note),
    };
  } catch {
    return EATOFINE_DEFAULTS;
  }
}

function formatAddress(value: Invoice["bill_to"]["address"]): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return value.address ?? value.formatted ?? "—";
}

/** Convert a number to Indian-English words. Used in the "Amount in words"
 *  line that's mandatory on every tax invoice. Handles paisa as a separate
 *  segment ("Twenty Nine Rupees and Forty Paisa Only"). */
function numberToWords(num: number): string {
  if (!Number.isFinite(num)) return "Zero";
  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function below1000(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below1000(n % 100) : "");
  }

  function inWords(n: number): string {
    if (n === 0) return "Zero";
    let result = "";
    const crore = Math.floor(n / 10_000_000);
    n %= 10_000_000;
    const lakh = Math.floor(n / 100_000);
    n %= 100_000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (crore) result += below1000(crore) + " Crore ";
    if (lakh) result += below1000(lakh) + " Lakh ";
    if (thousand) result += below1000(thousand) + " Thousand ";
    if (n) result += below1000(n);
    return result.trim();
  }

  const rupeesWords = inWords(rupees);
  if (paisa === 0) return `${rupeesWords} Rupees Only`;
  return `${rupeesWords} Rupees and ${inWords(paisa)} Paisa Only`;
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [inv, EATOFINE] = await Promise.all([
    adminFetch<Invoice>(`/admin/invoices/${id}`),
    loadEatofineSettings(),
  ]);

  const issuedOnText = inv.issued_on
    ? new Date(inv.issued_on).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  // Pull restaurant state code out of bill_from.state_code; if it matches
  // Eatofine's, transaction is intra-state → CGST + SGST. Otherwise IGST.
  const intraState = inv.bill_from.state_code === EATOFINE.state_code;

  return (
    <div className="p-6 max-w-5xl mx-auto print:p-0 print:max-w-none">
      {/* Top bar — back link + print button (hidden during print) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline">
          ← All invoices
        </Link>
        <PrintButton />
      </div>

      <div id="invoice-print-area" className="bg-white shadow-sm border border-slate-200 print:shadow-none print:border-0">
        {/* ── 1. Brand Header ─────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-black tracking-wide text-orange-600">{EATOFINE.short_name}</div>
              <div className="text-[10px] text-slate-500 tracking-widest uppercase">Food Delivery Service</div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-700">
              Original for Recipient
            </div>
          </div>
        </div>

        {/* ── 2. Tax Invoice band ─────────────────────────────────────── */}
        <div className="mx-8 mb-4 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-wide">Tax Invoice</h1>
            <span className="text-xs italic">(Original for Recipient)</span>
          </div>
        </div>

        {/* ── 3. Eatofine + Invoice meta (two columns) ───────────────── */}
        <div className="px-8 mb-4">
          <div className="border border-slate-300 rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-300">
              <div className="p-4">
                <div className="font-bold text-slate-900 text-sm">{EATOFINE.legal_name}</div>
                <div className="text-xs text-slate-700 mt-1.5 space-y-0.5">
                  <div><span className="font-semibold">Registered Office:</span> {EATOFINE.registered_office}</div>
                  <div><span className="font-semibold">State Code:</span> {EATOFINE.state_code}</div>
                  <div><span className="font-semibold">CIN:</span> {EATOFINE.cin}</div>
                  <div><span className="font-semibold">GSTIN:</span> {EATOFINE.gstin}</div>
                  <div><span className="font-semibold">PAN:</span> {EATOFINE.pan}</div>
                  <div><span className="font-semibold">FSSAI ID:</span> {EATOFINE.fssai}</div>
                </div>
              </div>
              <div className="p-4 text-sm">
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <span className="font-semibold text-slate-700 w-32">Invoice No:</span>
                    <span className="font-mono font-semibold text-slate-900">{inv.invoice_no}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-semibold text-slate-700 w-32">Invoice Date:</span>
                    <span className="text-slate-900">{issuedOnText}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-semibold text-slate-700 w-32">Place of Supply:</span>
                    <span className="text-slate-900">{inv.bill_from.state} ({inv.bill_from.state_code})</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="font-semibold text-slate-700 w-32">Payment:</span>
                    <span className="text-slate-900">
                      {inv.payment_method ?? "—"} ·{" "}
                      <span className={`font-semibold uppercase ${inv.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                        {inv.payment_status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Restaurant Details (orange band header) ─────────────── */}
        <div className="px-8 mb-4">
          <SectionBand color="orange" title="Restaurant Details" />
          <div className="border border-t-0 border-slate-300 p-4 text-sm space-y-1.5">
            <Row label="Restaurant Name" value={inv.bill_from.name} />
            <Row label="Restaurant Address" value={inv.bill_from.address} />
            <Row label="Restaurant State Code" value={inv.bill_from.state_code} />
            <Row label="Restaurant GSTIN" value={inv.bill_from.gstin} />
            <Row label="Restaurant FSSAI" value="—" placeholder />
            <Row label="Restaurant CIN" value="—" placeholder />
          </div>
        </div>

        {/* ── 5. Customer Details (yellow band header) ───────────────── */}
        <div className="px-8 mb-4">
          <SectionBand color="yellow" title="Customer Details" />
          <div className="border border-t-0 border-slate-300 p-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <Row label="Customer Name" value={inv.bill_to.name} />
              <Row label="Place of Delivery" value={`${inv.bill_from.state} (${inv.bill_from.state_code})`} />
              <Row label="Email" value={inv.bill_to.email ?? "—"} placeholder={!inv.bill_to.email} />
              <Row label="Phone" value={inv.bill_to.phone ?? "—"} placeholder={!inv.bill_to.phone} />
              <Row label="Address" value={formatAddress(inv.bill_to.address)} placeholder={formatAddress(inv.bill_to.address) === "—"} fullWidth />
            </div>
          </div>
        </div>

        {/* ── 6. Service Details (pink band header) ──────────────────── */}
        <div className="px-8 mb-4">
          <SectionBand color="pink" title="Service Details" />
          <div className="border border-t-0 border-slate-300 p-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              <Row label="HSN/SAC Code" value={inv.items[0]?.hsn ?? "996331"} />
              <Row label="Service Type" value="Restaurant Service" />
            </div>
          </div>
        </div>

        {/* ── 7. Order Details table — with CGST/SGST split ──────────── */}
        <div className="px-8 mb-4">
          <SectionBand color="orange" title="Order Details" />
          <table className="w-full text-xs border border-t-0 border-slate-300 border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-slate-700 font-semibold">
                <th className="border border-slate-300 px-2 py-2 text-left">Item</th>
                <th className="border border-slate-300 px-2 py-2 text-center w-12">Qty</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-20">Unit Rate</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-20">Amount</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-20">Sub Total</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-16">Discount</th>
                <th className="border border-slate-300 px-2 py-2 text-right w-20">Net Value</th>
                {intraState ? (
                  <>
                    <th className="border border-slate-300 px-2 py-2 text-right w-20">CGST<br /><span className="text-[9px] font-normal">(2.5%)</span></th>
                    <th className="border border-slate-300 px-2 py-2 text-right w-20">SGST<br /><span className="text-[9px] font-normal">(2.5%)</span></th>
                  </>
                ) : (
                  <th className="border border-slate-300 px-2 py-2 text-right w-20">IGST<br /><span className="text-[9px] font-normal">(5%)</span></th>
                )}
                <th className="border border-slate-300 px-2 py-2 text-right w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((it) => {
                const halfTax = it.tax / 2;
                const total = it.subtotal + it.tax;
                return (
                  <tr key={it.id} className="text-slate-800">
                    <td className="border border-slate-300 px-2 py-2">{it.name}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{it.qty}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">{it.unit_price.toFixed(2)}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">{it.subtotal.toFixed(2)}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">{it.subtotal.toFixed(2)}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">0.00</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">{it.subtotal.toFixed(2)}</td>
                    {intraState ? (
                      <>
                        <td className="border border-slate-300 px-2 py-2 text-right">{halfTax.toFixed(2)}</td>
                        <td className="border border-slate-300 px-2 py-2 text-right">{halfTax.toFixed(2)}</td>
                      </>
                    ) : (
                      <td className="border border-slate-300 px-2 py-2 text-right">{it.tax.toFixed(2)}</td>
                    )}
                    <td className="border border-slate-300 px-2 py-2 text-right font-semibold">{total.toFixed(2)}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className="border border-slate-300 px-2 py-2 text-right" colSpan={3}>Totals</td>
                <td className="border border-slate-300 px-2 py-2 text-right">₹{inv.summary.subtotal.toFixed(2)}</td>
                <td className="border border-slate-300 px-2 py-2 text-right">₹{inv.summary.subtotal.toFixed(2)}</td>
                <td className="border border-slate-300 px-2 py-2 text-right">₹0.00</td>
                <td className="border border-slate-300 px-2 py-2 text-right">₹{inv.summary.subtotal.toFixed(2)}</td>
                {intraState ? (
                  <>
                    <td className="border border-slate-300 px-2 py-2 text-right">₹{inv.summary.cgst.toFixed(2)}</td>
                    <td className="border border-slate-300 px-2 py-2 text-right">₹{inv.summary.sgst.toFixed(2)}</td>
                  </>
                ) : (
                  <td className="border border-slate-300 px-2 py-2 text-right">₹{inv.summary.igst.toFixed(2)}</td>
                )}
                <td className="border border-slate-300 px-2 py-2 text-right">₹{(inv.summary.grand_total - inv.summary.delivery_charge).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Delivery charge separate row (BRD §5.2 — distinct line on the invoice) */}
          {inv.summary.delivery_charge > 0 && (
            <div className="border-x border-b border-slate-300 px-3 py-2 text-xs flex justify-between bg-slate-50">
              <span className="font-semibold text-slate-700">+ Delivery Charge</span>
              <span className="font-semibold text-slate-900">₹{inv.summary.delivery_charge.toFixed(2)}</span>
            </div>
          )}

          {/* Grand total */}
          <div className="border-x border-b-2 border-b-orange-500 border-slate-300 px-3 py-3 text-sm flex justify-between bg-orange-50">
            <span className="font-bold text-slate-900">Grand Total</span>
            <span className="font-bold text-lg text-orange-700">₹{inv.summary.grand_total.toFixed(2)}</span>
          </div>
        </div>

        {/* ── 8. Amount in words ──────────────────────────────────────── */}
        <div className="px-8 mb-4">
          <div className="border border-slate-300 px-4 py-3 text-sm bg-amber-50/40">
            <span className="font-semibold text-slate-700">Amount Total in words:</span>{" "}
            <span className="italic text-slate-900">{numberToWords(inv.summary.grand_total)}</span>
          </div>
        </div>

        {/* ── 9. Disclaimer footer ────────────────────────────────────── */}
        <div className="px-8 mb-6">
          <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
            <li>{EATOFINE.footer_note}</li>
            <li>There is no reverse charge applicable on this order/service.</li>
            <li>For any disputes, jurisdiction is {EATOFINE.state}.</li>
          </ol>
        </div>

        {/* ── 10. Bottom contact strip ────────────────────────────────── */}
        <div className="border-t border-slate-200 px-8 py-4 bg-slate-50 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="font-semibold">For {EATOFINE.legal_name}</span>
          </div>
          <div className="flex flex-col md:items-end">
            <a href={`mailto:${EATOFINE.email}`} className="text-blue-600 hover:underline">{EATOFINE.email}</a>
            <a href={`https://${EATOFINE.website}`} className="text-blue-600 hover:underline">{EATOFINE.website}</a>
          </div>
        </div>
      </div>

      {/* Print CSS — classic "show only this element" pattern.
          Hides everything (admin shell, sidebar, tabs, browser chrome we
          can influence), then re-shows just #invoice-print-area + children. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }

          /* Hide every node in the document by default… */
          body * { visibility: hidden !important; }

          /* …then re-show only the invoice container and its descendants. */
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }

          /* Pin the invoice to the top-left of the printed page so the
             absolutely-positioned admin shell behind it doesn't push it down. */
          #invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 0 !important;
          }

          /* Make sure the body itself has no background or padding that
             would show through gaps. */
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          aside, nav, header, .sidebar, .print\\:hidden { display: none !important; }

          /* Force colored chips/bands to print with their colors instead of
             being optimized away (Chrome's "Background graphics" toggle). */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────

function SectionBand({ color, title }: { color: "orange" | "yellow" | "pink"; title: string }) {
  const colorClass =
    color === "orange" ? "bg-orange-500" :
    color === "yellow" ? "bg-amber-400" :
    "bg-pink-300";
  return (
    <div className={`${colorClass} text-white px-4 py-1.5 text-sm font-bold border border-b-0 border-slate-300`}>
      {title}
    </div>
  );
}

function Row({ label, value, placeholder, fullWidth }: { label: string; value: string; placeholder?: boolean; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <span className="font-semibold text-slate-700">{label}:</span>{" "}
      <span className={placeholder ? "text-slate-400 italic" : "text-slate-900"}>{value}</span>
      {placeholder && <span className="text-[10px] text-slate-400 ml-1">(unregistered)</span>}
    </div>
  );
}

