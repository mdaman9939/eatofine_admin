import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";
import { CreateNotificationTemplate } from "../../../components/CreateNotificationTemplate";

// Built-in template slugs — anything else under notif_msg.* is a custom template.
const BUILTIN_SLUGS = [
  "order_placed", "order_accepted", "order_picked_up", "order_delivered",
  "refund_processed", "otp", "vendor_new_order", "dm_new_order",
];

const GROUPS: FieldGroup[] = [
  {
    title: "Order placed",
    description: "Sent when a customer successfully places an order.",
    fields: [
      { key: "notif_msg.order_placed.title", label: "Push title", type: "text", defaultValue: "🎉 Order #{{order_id}} confirmed!", description: "Use {{merge_tags}} for dynamic values." },
      { key: "notif_msg.order_placed.body", label: "Push body", type: "textarea", defaultValue: "Hi {{customer_name}}, your order from {{restaurant_name}} is on its way. Track it now.", placeholder: "Body text" },
      { key: "notif_msg.order_placed.sms", label: "SMS template", type: "textarea", defaultValue: "Eatofine: Order {{order_id}} confirmed. Track at {{tracking_url}}" },
    ],
  },
  {
    title: "Order accepted by restaurant",
    fields: [
      { key: "notif_msg.order_accepted.title", label: "Push title", type: "text", defaultValue: "🍳 {{restaurant_name}} accepted your order!" },
      { key: "notif_msg.order_accepted.body", label: "Push body", type: "textarea", defaultValue: "Your food will be ready in approximately {{prep_time}} minutes." },
    ],
  },
  {
    title: "Order out for delivery",
    fields: [
      { key: "notif_msg.order_picked_up.title", label: "Push title", type: "text", defaultValue: "🛵 {{dm_name}} picked up your order" },
      { key: "notif_msg.order_picked_up.body", label: "Push body", type: "textarea", defaultValue: "{{dm_name}} is on the way with your food. ETA: {{eta}} minutes." },
    ],
  },
  {
    title: "Order delivered",
    fields: [
      { key: "notif_msg.order_delivered.title", label: "Push title", type: "text", defaultValue: "✅ Order delivered!" },
      { key: "notif_msg.order_delivered.body", label: "Push body", type: "textarea", defaultValue: "Enjoy your meal, {{customer_name}}! Rate your experience to help us improve." },
    ],
  },
  {
    title: "Refund processed",
    fields: [
      { key: "notif_msg.refund_processed.title", label: "Push title", type: "text", defaultValue: "💸 Refund of ₹{{amount}} processed" },
      { key: "notif_msg.refund_processed.body", label: "Push body", type: "textarea", defaultValue: "Your refund for order #{{order_id}} has been credited to your wallet." },
      { key: "notif_msg.refund_processed.sms", label: "SMS template", type: "textarea", defaultValue: "Eatofine: Refund of Rs {{amount}} processed for order {{order_id}}. Check your wallet." },
    ],
  },
  {
    title: "OTP",
    fields: [
      { key: "notif_msg.otp.sms", label: "SMS template", type: "textarea", defaultValue: "Eatofine: Your OTP is {{otp}}. Do not share with anyone. Valid for 10 minutes." },
    ],
  },
  {
    title: "Vendor — New order",
    fields: [
      { key: "notif_msg.vendor_new_order.title", label: "Push title", type: "text", defaultValue: "🔔 New order #{{order_id}}" },
      { key: "notif_msg.vendor_new_order.body", label: "Push body", type: "textarea", defaultValue: "{{item_count}} items · ₹{{order_amount}} · Accept within 5 minutes." },
    ],
  },
  {
    title: "DM — New assignment",
    fields: [
      { key: "notif_msg.dm_new_order.title", label: "Push title", type: "text", defaultValue: "📦 New delivery for you" },
      { key: "notif_msg.dm_new_order.body", label: "Push body", type: "textarea", defaultValue: "Pickup from {{restaurant_name}} · {{distance}} km · ₹{{payout}} payout." },
    ],
  },
];

export default async function NotificationMessagesPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=notif_msg.",
  );

  // Discover custom templates created via "Create notification template":
  // keys look like notif_msg.<slug>.<field>. Anything not built-in is custom.
  const valueByKey = new Map(data.settings.map((s) => [s.key, s.value]));
  const customSlugs = Array.from(
    new Set(
      data.settings
        .map((s) => s.key.split(".")[1])
        .filter((slug): slug is string => !!slug && !BUILTIN_SLUGS.includes(slug)),
    ),
  );
  const customGroups: FieldGroup[] = customSlugs.map((slug) => ({
    title: (valueByKey.get(`notif_msg.${slug}._name`) as string) || slug,
    description: "Custom template.",
    fields: [
      { key: `notif_msg.${slug}.title`, label: "Push title", type: "text" },
      { key: `notif_msg.${slug}.body`, label: "Push body", type: "textarea" },
      { key: `notif_msg.${slug}.sms`, label: "SMS template", type: "textarea" },
    ],
  }));
  const allGroups = [...GROUPS, ...customGroups];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · NOTIFICATIONS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Notification Messages</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Editable copy for every push / SMS notification template. Merge tags like <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">{`{{customer_name}}`}</code> are replaced at send time.
          </p>
        </div>
      </div>
      <CreateNotificationTemplate existingSlugs={[...BUILTIN_SLUGS, ...customSlugs]} />
      <SettingsForm initial={data.settings} groups={allGroups} />
    </div>
  );
}
