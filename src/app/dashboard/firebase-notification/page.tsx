import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Firebase Cloud Messaging (FCM)",
    description: "Server credentials used to send push notifications to the customer, restaurant and delivery apps.",
    fields: [
      { key: "fcm.enabled", label: "Enable push notifications", type: "checkbox", defaultValue: "true" },
      { key: "fcm.server_key", label: "FCM server key", type: "text", placeholder: "AAAA…" },
      { key: "fcm.sender_id", label: "Sender ID", type: "text", placeholder: "1234567890" },
      { key: "fcm.project_id", label: "Project ID", type: "text", placeholder: "eatofine-app" },
    ],
  },
  {
    title: "Web push config",
    description: "Firebase web app config (used for the customer web app push).",
    fields: [
      { key: "fcm.api_key", label: "apiKey", type: "text" },
      { key: "fcm.auth_domain", label: "authDomain", type: "text" },
      { key: "fcm.app_id", label: "appId", type: "text" },
      { key: "fcm.measurement_id", label: "measurementId", type: "text" },
      { key: "fcm.vapid_key", label: "Web push VAPID key", type: "text" },
    ],
  },
];

export default async function FirebaseNotificationPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=fcm.",
  );
  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · 3RD PARTY
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Firebase Notification</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">FCM credentials for sending push notifications across all apps.</p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
