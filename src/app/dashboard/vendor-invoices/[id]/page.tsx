import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { PrintButton } from "../../invoices/[id]/PrintButton";

/**
 * Restaurant subscription / commission tax invoice (PDF-faithful).
 *
 * Layout matches the official `Eatofine Restaurant Invoice - Subscription
 * charge.pdf` exactly: orange "Tax Invoice" band, Eatofine + Invoice meta
 * row, yellow "Restaurant Details" band, pink "Service Details" band,
 * orange "Work Summary" band, single-line totals table with CGST + SGST
 * columns, amount-in-words, footer with email/website + disclaimer notes.
 *
 * Reuses PrintButton + print-only CSS from the customer invoice page.
 */

interface VendorInvoice {
  id: number;
  invoice_number: string;
  plan_type: "commission" | "ppo" | "subscription";
  period_start: string | null;
  period_end: string | null;
  subscription_fee: number;
  commission_base: number;
  ppo_base: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_amount: number;
  status: string;
  issued_at: string | null;
  restaurant: {
    id: number;
    name: string | null;
    registered_name: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    cin: string | null;
    fssai: string | null;
    state_code: string | null;
  } | null;
}

const EATOFINE_DEFAULTS = {
  legal_name: "Eatofine Delivery Service Pvt. Ltd.",
  short_name: "EATOFINE",
  logo_url: "",
  registered_office: ". FF2, Vishnu Palace, Sec 20B, Faridabad NIT, Faridabad, Haryana, India, 121001, India",
  state: "Haryana",
  state_code: "06",
  cin: "U56103HR2025PTC131940",
  gstin: "",
  pan: "",
  fssai: "",
  email: "eatofine@gmail.com",
  website: "www.eatofine.com",
};

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
      logo_url: pick("logo_url", EATOFINE_DEFAULTS.logo_url),
      registered_office: pick("registered_office", EATOFINE_DEFAULTS.registered_office),
      state: pick("state", EATOFINE_DEFAULTS.state),
      state_code: pick("state_code", EATOFINE_DEFAULTS.state_code),
      cin: pick("cin", EATOFINE_DEFAULTS.cin),
      gstin: pick("gstin", EATOFINE_DEFAULTS.gstin),
      pan: pick("pan", EATOFINE_DEFAULTS.pan),
      fssai: pick("fssai", EATOFINE_DEFAULTS.fssai),
      email: pick("email", EATOFINE_DEFAULTS.email),
      website: pick("website", EATOFINE_DEFAULTS.website),
    };
  } catch {
    return EATOFINE_DEFAULTS;
  }
}

function numberToWords(num: number): string {
  if (!Number.isFinite(num)) return "Zero";
  const rupees = Math.floor(num);
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
    let r = "";
    const cr = Math.floor(n / 10_000_000); n %= 10_000_000;
    const lk = Math.floor(n / 100_000); n %= 100_000;
    const th = Math.floor(n / 1000); n %= 1000;
    if (cr) r += below1000(cr) + " Crore ";
    if (lk) r += below1000(lk) + " Lakh ";
    if (th) r += below1000(th) + " Thousand ";
    if (n) r += below1000(n);
    return r.trim();
  }
  return `${inWords(rupees)} Only`;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD like the PDF
}

export default async function VendorInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [inv, EATOFINE] = await Promise.all([
    adminFetch<VendorInvoice>(`/admin/vendor-invoices/${id}`),
    loadEatofineSettings(),
  ]);

  if (!inv) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Link href="/dashboard/vendor-invoices" className="text-orange-600 hover:underline">← All vendor invoices</Link>
        <p className="mt-4">Invoice #{id} not found.</p>
      </div>
    );
  }

  // Line description varies by plan_type — subscription matches the PDF
  // verbatim ("Online platform Subscription Fee"); commission/ppo use
  // descriptive text so the same template handles all three plan types.
  const lineDescription = inv.plan_type === "subscription"
    ? "Online platform Subscription Fee"
    : "Online platform usage Fee";

  const baseAmount = inv.taxable_amount || inv.subscription_fee || inv.commission_base || inv.ppo_base;
  const cgstPct = baseAmount > 0 ? Math.round((inv.cgst / baseAmount) * 100) : 9;
  const sgstPct = baseAmount > 0 ? Math.round((inv.sgst / baseAmount) * 100) : 9;

  return (
    <div className="p-6 max-w-4xl mx-auto print:p-0 print:max-w-none bg-slate-50 print:bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/dashboard/vendor-invoices" className="text-sm text-blue-600 hover:underline">
          ← All vendor invoices
        </Link>
        <PrintButton />
      </div>

      <div id="invoice-print-area" className="bg-white border border-slate-300 print:border-0">
        {/* ── 1. Brand header ─────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between">
          <div>
            <div className="text-2xl font-black tracking-wide text-orange-600">{EATOFINE.short_name}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {EATOFINE.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={EATOFINE.logo_url} alt={EATOFINE.short_name} className="w-20 h-20 object-contain" />
            ) : (
              // Delivery-scooter fallback (matches the PDF artwork closely).
              <svg className="w-20 h-20" viewBox="0 0 64 64" fill="none">
                <circle cx="15" cy="48" r="8" stroke="#ea580c" strokeWidth="3" />
                <circle cx="49" cy="48" r="8" stroke="#ea580c" strokeWidth="3" />
                <path d="M9 48h6m26 0h0" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
                <path d="M15 48l9-20h9l8 20" stroke="#ea580c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                <rect x="33" y="16" width="15" height="14" rx="2" fill="#facc15" stroke="#ea580c" strokeWidth="2" />
                <path d="M40.5 16v14M33 23h15" stroke="#ea580c" strokeWidth="1.5" />
                <path d="M24 28l-7-9h-6" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
                <circle cx="30" cy="20" r="5" fill="#ea580c" />
              </svg>
            )}
            <span className="text-sm font-bold text-slate-900">Original for Recipient</span>
          </div>
        </div>

        {/* ── 2. Tax Invoice band ─────────────────────────────────── */}
        <div className="mx-8 bg-orange-500 text-white px-4 py-2">
          <h1 className="text-lg font-bold">Tax Invoice</h1>
        </div>

        {/* ── 3. Eatofine details + invoice meta ──────────────────── */}
        <div className="px-8 py-4">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-slate-900 mb-1">{EATOFINE.legal_name}</div>
              <div><span className="font-semibold">Registered Office:</span> {EATOFINE.registered_office}</div>
              <div><span className="font-semibold">State Code:</span> {EATOFINE.state_code}</div>
              <div><span className="font-semibold">CIN:</span> {EATOFINE.cin}</div>
              <div><span className="font-semibold">GSTIN:</span> {EATOFINE.gstin || dottedPlaceholder()}</div>
              <div><span className="font-semibold">PAN:</span> {EATOFINE.pan || dottedPlaceholder()}</div>
              <div><span className="font-semibold">FSSAI ID:</span> {EATOFINE.fssai || dottedPlaceholder()}</div>
            </div>
            <div className="space-y-1 text-sm">
              <div><span className="font-bold">Invoice No</span>: <span className="font-mono">{inv.invoice_number}</span></div>
              <div><span className="font-bold">Invoice Date</span>: {fmtDate(inv.issued_at ?? inv.period_end)}</div>
            </div>
          </div>
        </div>

        {/* ── 4. Restaurant Details (yellow band) ─────────────────── */}
        <div className="mx-8 bg-amber-400 px-4 py-1.5 text-sm font-bold text-slate-900">
          Restaurant Details:
        </div>
        <div className="px-8 py-3 text-xs space-y-0.5">
          <div><span className="font-semibold">Registered Name:</span> {inv.restaurant?.registered_name || dottedPlaceholder()}</div>
          <div><span className="font-semibold">Trade Name:</span> {inv.restaurant?.name || dottedPlaceholder()}</div>
          <div><span className="font-semibold">Restaurant Address:</span> {inv.restaurant?.address || dottedPlaceholder()}</div>
          <div><span className="font-semibold">State Code:</span> {inv.restaurant?.state_code || EATOFINE.state_code}</div>
          <div><span className="font-semibold">Restaurant ID:</span> {inv.restaurant?.id ?? dottedPlaceholder()}</div>
          <div><span className="font-semibold">FSSAI ID:</span> {inv.restaurant?.fssai || dottedPlaceholder()}</div>
          <div>
            <span className="font-semibold">Restaurant GSTIN:</span>{" "}
            {inv.restaurant?.gstin || "XXXXXXXXXXXXXXX"}
            {!inv.restaurant?.gstin && <span className="text-rose-600 text-[10px] ml-1">(Mention unregistered in case of non GST)</span>}
          </div>
          <div>
            <span className="font-semibold">Restaurant CIN:</span>{" "}
            {inv.restaurant?.cin || dottedPlaceholder()}
            {!inv.restaurant?.cin && <span className="text-rose-600 text-[10px] ml-1">(Mention unregistered in case of non CIN)</span>}
          </div>
        </div>

        {/* ── 5. Service Details (pink band) ──────────────────────── */}
        <div className="mx-8 bg-pink-200 px-4 py-1.5 text-sm font-bold text-slate-900">
          Service Details:
        </div>
        <div className="px-8 py-3 text-xs">
          <div className="flex gap-8">
            <div><span className="font-semibold">HSN Code:</span> 998599</div>
            <div><span className="font-semibold">Service Descriptions:</span> Support Service</div>
          </div>
        </div>

        {/* ── 6. Work Summary (orange band) ───────────────────────── */}
        <div className="mx-8 bg-orange-500 text-white px-4 py-1.5 text-sm font-bold flex items-center justify-between gap-3 flex-wrap">
          <span>Work Summary:</span>
          <span>Invoice Period: {fmtDate(inv.period_start)} to {fmtDate(inv.period_end)}</span>
        </div>
        <div className="px-8 py-3">
          <table className="w-full text-xs border border-slate-700 border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="border border-slate-700 px-2 py-1.5 text-left w-12">S.no</th>
                <th className="border border-slate-700 px-2 py-1.5 text-left">Description</th>
                <th className="border border-slate-700 px-2 py-1.5 text-left w-24">Amount (₹)</th>
                <th className="border border-slate-700 px-2 py-1.5 text-left w-20">CGST<br />({cgstPct}%)</th>
                <th className="border border-slate-700 px-2 py-1.5 text-left w-20">SGST<br />({sgstPct}%)</th>
                <th className="border border-slate-700 px-2 py-1.5 text-left w-24">Net Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-700 px-2 py-2">1.</td>
                <td className="border border-slate-700 px-2 py-2">{lineDescription}</td>
                <td className="border border-slate-700 px-2 py-2">{baseAmount.toFixed(0)}</td>
                <td className="border border-slate-700 px-2 py-2">{inv.cgst.toFixed(0)}</td>
                <td className="border border-slate-700 px-2 py-2">{inv.sgst.toFixed(0)}</td>
                <td className="border border-slate-700 px-2 py-2">{inv.total_amount.toFixed(2)}</td>
              </tr>
              {/* Empty filler row to match the PDF spacing */}
              <tr>
                <td className="border border-slate-700 px-2 py-2 h-7">&nbsp;</td>
                <td className="border border-slate-700 px-2 py-2"></td>
                <td className="border border-slate-700 px-2 py-2"></td>
                <td className="border border-slate-700 px-2 py-2"></td>
                <td className="border border-slate-700 px-2 py-2"></td>
                <td className="border border-slate-700 px-2 py-2"></td>
              </tr>
              <tr>
                <td className="border border-slate-700 px-2 py-2 font-semibold" colSpan={5}>Total</td>
                <td className="border border-slate-700 px-2 py-2 font-semibold">{inv.total_amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 7. Amount in words ──────────────────────────────────── */}
        <div className="px-8 pb-4 text-xs">
          <span className="font-bold">Amount Total in words:</span>{" "}
          <span>{numberToWords(inv.total_amount)}</span>
        </div>

        {/* ── 8. Signature block ──────────────────────────────────── */}
        <div className="px-8 py-8">
          <div className="flex justify-end text-xs">
            <div className="text-right space-y-0.5">
              <div>For {EATOFINE.legal_name}</div>
              <a href={`mailto:${EATOFINE.email}`} className="text-blue-600 hover:underline block">{EATOFINE.email}</a>
              <a href={`https://${EATOFINE.website}`} className="text-blue-600 hover:underline block">{EATOFINE.website}</a>
            </div>
          </div>
        </div>

        {/* ── 9. Footer disclaimers ───────────────────────────────── */}
        <div className="px-8 pb-8 text-xs">
          <ol className="space-y-1 list-decimal list-inside">
            <li className="font-semibold">This is a computer generated document, No signature required.</li>
            <li className="font-semibold">There is no reverse charge applicable on this order/service.</li>
          </ol>
        </div>
      </div>

      {/* Print CSS — same isolation pattern as the customer invoice page. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
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
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          aside, nav, header, .sidebar, .print\\:hidden { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

function dottedPlaceholder() {
  return <span className="text-slate-400 tracking-widest">…………………………………</span>;
}
