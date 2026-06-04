import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Authentication methods",
    description: "Which login channels are exposed to which role.",
    fields: [
      { key: "login.email_password", label: "Email + Password", type: "checkbox", defaultValue: "true", description: "Standard login. Strongly recommended to keep enabled." },
      { key: "login.otp_enabled", label: "OTP login (phone)", type: "checkbox", defaultValue: "true" },
      {
        key: "login.otp_provider", label: "OTP provider", type: "select",
        defaultValue: "firebase",
        options: [
          { value: "firebase", label: "Firebase Phone Auth" },
          { value: "twilio", label: "Twilio SMS" },
          { value: "msg91", label: "MSG91" },
          { value: "email", label: "Email OTP" },
        ],
        description: "Used when OTP login is enabled.",
      },
      { key: "login.biometric_enabled", label: "Biometric login", type: "checkbox", defaultValue: "true", description: "Fingerprint / FaceID on Restaurant + Delivery apps." },
    ],
  },
  {
    title: "Social login providers",
    description: "Per-provider toggles for customer + vendor apps.",
    fields: [
      { key: "login.social.google", label: "Google", type: "checkbox", defaultValue: "true" },
      { key: "login.social.facebook", label: "Facebook", type: "checkbox", defaultValue: "false" },
      { key: "login.social.apple", label: "Apple", type: "checkbox", defaultValue: "false" },
      { key: "login.social.linkedin", label: "LinkedIn", type: "checkbox", defaultValue: "false" },
    ],
  },
  {
    title: "Security",
    description: "Captcha, MFA, and session controls.",
    fields: [
      {
        key: "login.captcha_provider", label: "Captcha provider", type: "select",
        defaultValue: "recaptcha_v3",
        options: [
          { value: "", label: "Disabled" },
          { value: "recaptcha_v3", label: "reCAPTCHA v3 (invisible)" },
          { value: "recaptcha_v2", label: "reCAPTCHA v2 (checkbox)" },
          { value: "hcaptcha", label: "hCaptcha" },
          { value: "turnstile", label: "Cloudflare Turnstile" },
        ],
      },
      { key: "login.mfa_for_admins", label: "Require MFA for admins", type: "checkbox", defaultValue: "false", description: "Time-based one-time password (TOTP) for the admin panel." },
      { key: "login.session_ttl_hours", label: "Session lifetime (hours)", type: "number", defaultValue: "12", placeholder: "12" },
      { key: "login.lockout_after", label: "Lockout after N failed attempts", type: "number", defaultValue: "10", placeholder: "10" },
    ],
  },
  {
    title: "Password policy",
    description: "Rules enforced at signup + password reset.",
    fields: [
      { key: "login.password_min_length", label: "Minimum length", type: "number", defaultValue: "8" },
      { key: "login.password_require_special", label: "Require special character", type: "checkbox", defaultValue: "false" },
      { key: "login.password_require_number", label: "Require number", type: "checkbox", defaultValue: "true" },
      { key: "login.password_expiry_days", label: "Expiry (days, 0 = never)", type: "number", defaultValue: "0" },
    ],
  },
];

export default async function LoginSetupPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=login.",
  );

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · AUTH
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Login Setup</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Configure which login methods + social providers are available, captcha, MFA, and password policy. Changes apply at the next login attempt.
          </p>
        </div>
      </div>

      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
