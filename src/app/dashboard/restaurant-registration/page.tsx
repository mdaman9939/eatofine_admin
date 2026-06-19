import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";
import { AdditionalDataBuilder } from "../../../components/AdditionalDataBuilder";

interface Setting {
  id: number;
  key: string;
  value: string | null;
}

const GROUPS: FieldGroup[] = [
  {
    title: "Restaurant registration",
    description:
      "Controls the restaurant app's self sign-up. New restaurants register as PENDING and appear under Restaurants → Joining Requests for you to approve.",
    fields: [
      {
        key: "toggle_restaurant_registration",
        label: "Allow restaurant self-registration",
        type: "checkbox",
        description: "When off, the restaurant app's “Register” form is rejected with a friendly message.",
        defaultValue: "true",
      },
      {
        key: "admin_commission",
        label: "Default commission (%)",
        type: "number",
        description:
          "Commission a commission-based restaurant pays on each order. Shown on the “Commission Base” card during sign-up and applied to new restaurants.",
        defaultValue: "0",
        placeholder: "e.g. 10",
      },
    ],
  },
];

export default async function RestaurantRegistrationPage() {
  // Pull the registration toggle + commission, and the custom-fields JSON.
  const [toggle, commission, additional] = await Promise.all([
    adminFetch<{ settings: Setting[] }>("/admin/business-settings?prefix=toggle_restaurant_registration"),
    adminFetch<{ settings: Setting[] }>("/admin/business-settings?prefix=admin_commission"),
    adminFetch<{ settings: Setting[] }>("/admin/business-settings?prefix=restaurant_additional_join_us_page_data"),
  ]);

  const settings = [...toggle.settings, ...commission.settings];
  const additionalValue =
    additional.settings.find((s) => s.key === "restaurant_additional_join_us_page_data")?.value ?? null;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> Restaurant · Sign-up
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Restaurant Registration</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Turn self sign-up on/off, set the commission new restaurants pay, and customise the extra fields the sign-up
            form collects.
          </p>
        </div>
      </div>

      <SettingsForm initial={settings} groups={GROUPS} />

      <AdditionalDataBuilder initialValue={additionalValue} />
    </div>
  );
}
