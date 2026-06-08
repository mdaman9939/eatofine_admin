import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "SMS gateway",
    description: "Provider used to send OTP + transactional SMS.",
    fields: [
      { key: "tp.sms.provider", label: "Provider", type: "select", defaultValue: "twilio", options: [
        { value: "", label: "Disabled" },
        { value: "twilio", label: "Twilio" },
        { value: "nexmo", label: "Vonage / Nexmo" },
        { value: "msg91", label: "MSG91" },
        { value: "2factor", label: "2Factor" },
      ] },
      { key: "tp.sms.sid", label: "Account SID / API key", type: "text" },
      { key: "tp.sms.token", label: "Auth token / secret", type: "text" },
      { key: "tp.sms.from", label: "From number / sender ID", type: "text" },
    ],
  },
  {
    title: "Mail (SMTP)",
    description: "Outgoing email server for transactional mail.",
    fields: [
      { key: "tp.mail.host", label: "SMTP host", type: "text", placeholder: "smtp.mailgun.org" },
      { key: "tp.mail.port", label: "Port", type: "number", defaultValue: "587" },
      { key: "tp.mail.username", label: "Username", type: "text" },
      { key: "tp.mail.password", label: "Password", type: "text" },
      { key: "tp.mail.from_address", label: "From address", type: "text", placeholder: "noreply@eatofine.com" },
      { key: "tp.mail.from_name", label: "From name", type: "text", defaultValue: "Eatofine" },
    ],
  },
  {
    title: "Storage connection (S3)",
    description: "Cloud object storage for uploaded media.",
    fields: [
      { key: "tp.storage.driver", label: "Driver", type: "select", defaultValue: "local", options: [
        { value: "local", label: "Local disk" },
        { value: "s3", label: "Amazon S3 / compatible" },
      ] },
      { key: "tp.storage.s3_key", label: "Access key", type: "text" },
      { key: "tp.storage.s3_secret", label: "Secret key", type: "text" },
      { key: "tp.storage.s3_bucket", label: "Bucket", type: "text" },
      { key: "tp.storage.s3_region", label: "Region", type: "text", placeholder: "ap-south-1" },
      { key: "tp.storage.s3_endpoint", label: "Endpoint (for compatible)", type: "text" },
    ],
  },
  {
    title: "reCAPTCHA & Social login keys",
    fields: [
      { key: "tp.recaptcha.site_key", label: "reCAPTCHA site key", type: "text" },
      { key: "tp.recaptcha.secret_key", label: "reCAPTCHA secret key", type: "text" },
      { key: "tp.social.google_client_id", label: "Google OAuth client ID", type: "text" },
      { key: "tp.social.google_secret", label: "Google OAuth secret", type: "text" },
      { key: "tp.social.facebook_app_id", label: "Facebook app ID", type: "text" },
      { key: "tp.social.facebook_secret", label: "Facebook app secret", type: "text" },
    ],
  },
];

export default async function ThirdPartyConfigPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=tp.",
  );
  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · 3RD PARTY & CONFIGURATIONS
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">3rd Party & Configurations</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">SMS, mail, storage, reCAPTCHA and social-login credentials.</p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
