import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

function gatewayGroup(slug: string, label: string, currencies: string, fields: string[][]): FieldGroup {
  return {
    title: `${label}  ·  ${currencies}`,
    description: `Configure credentials for ${label}. Leave disabled if not used.`,
    fields: [
      { key: `gateway.${slug}.enabled`, label: "Enabled", type: "checkbox", defaultValue: "false" },
      { key: `gateway.${slug}.mode`, label: "Mode", type: "select", defaultValue: "sandbox", options: [
        { value: "sandbox", label: "Sandbox / Test" },
        { value: "live", label: "Live" },
      ] },
      ...fields.map(([key, lbl, type = "text"]) => ({
        key: `gateway.${slug}.${key}`,
        label: lbl,
        type: type as "text" | "url",
        placeholder: type === "url" ? "https://…" : undefined,
      })),
    ],
  };
}

const GROUPS: FieldGroup[] = [
  gatewayGroup("razorpay", "Razorpay", "INR", [
    ["key_id", "Key ID"],
    ["key_secret", "Key Secret"],
    ["webhook_secret", "Webhook Secret"],
  ]),
  gatewayGroup("stripe", "Stripe", "USD, EUR, GBP, INR", [
    ["publishable_key", "Publishable Key"],
    ["secret_key", "Secret Key"],
    ["webhook_secret", "Webhook Secret"],
  ]),
  gatewayGroup("paypal", "PayPal", "USD, EUR, GBP", [
    ["client_id", "Client ID"],
    ["client_secret", "Client Secret"],
  ]),
  gatewayGroup("phonepe", "PhonePe", "INR", [
    ["merchant_id", "Merchant ID"],
    ["salt_key", "Salt Key"],
    ["salt_index", "Salt Index"],
  ]),
  gatewayGroup("paytm", "Paytm", "INR", [
    ["merchant_id", "Merchant ID"],
    ["merchant_key", "Merchant Key"],
  ]),
  gatewayGroup("bkash", "bKash", "BDT", [
    ["app_key", "App Key"],
    ["app_secret", "App Secret"],
    ["username", "Username"],
    ["password", "Password"],
  ]),
  gatewayGroup("sslcommerz", "SSLCommerz", "BDT, USD", [
    ["store_id", "Store ID"],
    ["store_password", "Store Password"],
  ]),
  gatewayGroup("flutterwave", "Flutterwave", "NGN, USD, GHS, KES", [
    ["public_key", "Public Key"],
    ["secret_key", "Secret Key"],
    ["encryption_key", "Encryption Key"],
  ]),
];

export default async function PaymentGatewaysPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=gateway.",
  );

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · 3RD PARTY
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Configure gateway credentials. Each gateway has its own group — enable, switch to live mode once tested, paste API keys.
          </p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
