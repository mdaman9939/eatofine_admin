import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

// For each event, the row is: customer/vendor/dm + push/email/sms/inapp toggle.
// Keys follow the pattern `notif.<event>.<audience>.<channel>` so the DB is
// queryable per-event later.

function eventGroup(eventKey: string, eventLabel: string): FieldGroup {
  return {
    title: eventLabel,
    description: `Which channels fire when "${eventLabel.toLowerCase()}" happens?`,
    fields: [
      { key: `notif.${eventKey}.customer.push`, label: "Customer · Push", type: "checkbox", defaultValue: "true" },
      { key: `notif.${eventKey}.customer.email`, label: "Customer · Email", type: "checkbox", defaultValue: "true" },
      { key: `notif.${eventKey}.customer.sms`, label: "Customer · SMS", type: "checkbox", defaultValue: "false" },
      { key: `notif.${eventKey}.vendor.push`, label: "Vendor · Push", type: "checkbox", defaultValue: "true" },
      { key: `notif.${eventKey}.vendor.email`, label: "Vendor · Email", type: "checkbox", defaultValue: "false" },
      { key: `notif.${eventKey}.dm.push`, label: "DM · Push", type: "checkbox", defaultValue: "true" },
      { key: `notif.${eventKey}.dm.sms`, label: "DM · SMS", type: "checkbox", defaultValue: "false" },
    ],
  };
}

const GROUPS: FieldGroup[] = [
  eventGroup("order_placed", "Order placed"),
  eventGroup("order_accepted", "Order accepted by restaurant"),
  eventGroup("order_handover", "Order ready for pickup"),
  eventGroup("order_picked_up", "Order picked up by rider"),
  eventGroup("order_delivered", "Order delivered"),
  eventGroup("order_canceled", "Order canceled"),
  eventGroup("refund_processed", "Refund processed"),
  eventGroup("payout_sent", "Payout sent (vendor/DM)"),
  {
    title: "Quiet hours",
    description: "Suppress non-critical pushes during these hours (24h format).",
    fields: [
      { key: "notif.quiet_hours.enabled", label: "Enable quiet hours", type: "checkbox", defaultValue: "true" },
      { key: "notif.quiet_hours.start", label: "Start (24h)", type: "text", defaultValue: "23:00", placeholder: "23:00" },
      { key: "notif.quiet_hours.end", label: "End (24h)", type: "text", defaultValue: "07:00", placeholder: "07:00" },
    ],
  },
];

export default async function NotificationChannelsPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=notif.",
  );

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · NOTIFICATIONS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Notification Channels</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            For each system event × audience: pick which channels fire — push, email, SMS. Tune the noise floor of your platform.
          </p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
