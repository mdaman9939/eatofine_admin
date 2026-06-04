import { adminFetch } from "../../../lib/api";
import { SettingsForm, type FieldGroup } from "../../../components/SettingsForm";

const GROUPS: FieldGroup[] = [
  {
    title: "Hero section",
    description: "First fold of the public marketing site — what visitors see immediately.",
    fields: [
      { key: "landing.hero.enabled", label: "Show hero section", type: "checkbox", defaultValue: "true" },
      { key: "landing.hero.title", label: "Hero title", type: "text", defaultValue: "Hungry? Get food delivered in 30 min.", placeholder: "Main headline" },
      { key: "landing.hero.subtitle", label: "Hero subtitle", type: "textarea", defaultValue: "From the best local restaurants, hot to your doorstep.", placeholder: "Supporting copy" },
      { key: "landing.hero.cta_text", label: "CTA button text", type: "text", defaultValue: "Order Now" },
      { key: "landing.hero.cta_target", label: "CTA target", type: "url", placeholder: "/restaurants" },
      { key: "landing.hero.image_url", label: "Hero image", type: "url", placeholder: "/storage/landing/hero.png" },
    ],
  },
  {
    title: "Features section",
    description: "Four cards explaining why customers should choose your platform.",
    fields: [
      { key: "landing.features.enabled", label: "Show features section", type: "checkbox", defaultValue: "true" },
      { key: "landing.features.title", label: "Section title", type: "text", defaultValue: "Why Eatofine?" },
      { key: "landing.features.f1_title", label: "Feature 1 title", type: "text", defaultValue: "Live tracking" },
      { key: "landing.features.f1_body", label: "Feature 1 body", type: "textarea", defaultValue: "Watch your rider on the map in real time." },
      { key: "landing.features.f2_title", label: "Feature 2 title", type: "text", defaultValue: "Multiple payments" },
      { key: "landing.features.f2_body", label: "Feature 2 body", type: "textarea", defaultValue: "Cash · Card · UPI · Wallet — pay your way." },
      { key: "landing.features.f3_title", label: "Feature 3 title", type: "text", defaultValue: "Ratings & reviews" },
      { key: "landing.features.f3_body", label: "Feature 3 body", type: "textarea", defaultValue: "Trust the crowd — every restaurant rated." },
      { key: "landing.features.f4_title", label: "Feature 4 title", type: "text", defaultValue: "Refunds in 24h" },
      { key: "landing.features.f4_body", label: "Feature 4 body", type: "textarea", defaultValue: "Wrong order? Refund directly to your wallet." },
    ],
  },
  {
    title: "Download CTA",
    fields: [
      { key: "landing.download.enabled", label: "Show download section", type: "checkbox", defaultValue: "true" },
      { key: "landing.download.title", label: "Download CTA title", type: "text", defaultValue: "Get the app" },
      { key: "landing.download.body", label: "Subtitle", type: "textarea", defaultValue: "Faster orders. Loyalty points. Push notifications when food arrives." },
    ],
  },
  {
    title: "Other sections",
    description: "Visibility toggles for additional sections.",
    fields: [
      { key: "landing.cuisines.enabled", label: "Show cuisines grid", type: "checkbox", defaultValue: "true" },
      { key: "landing.testimonials.enabled", label: "Show testimonials", type: "checkbox", defaultValue: "false" },
      { key: "landing.faq.enabled", label: "Show FAQ", type: "checkbox", defaultValue: "true" },
      { key: "landing.partner_cta.enabled", label: "Show \"Become a partner\" CTA", type: "checkbox", defaultValue: "true" },
    ],
  },
  {
    title: "SEO meta",
    description: "Open Graph + meta tags for the landing URL.",
    fields: [
      { key: "landing.seo.title", label: "Meta title", type: "text", defaultValue: "Eatofine — Food delivery, fast" },
      { key: "landing.seo.description", label: "Meta description", type: "textarea", defaultValue: "Order food from your favorite local restaurants. Live tracking, hot delivery, easy refunds." },
      { key: "landing.seo.og_image", label: "OG image", type: "url", placeholder: "/storage/landing/og-image.png" },
    ],
  },
];

export default async function LandingPageSettingsPage() {
  const data = await adminFetch<{ settings: Array<{ id: number; key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=landing.",
  );

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> CONTENT · MARKETING SITE
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Landing Page Settings</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Configure the public marketing site sections — hero, features, FAQ, CTAs. Toggle sections and edit copy without a code change.
          </p>
        </div>
      </div>
      <SettingsForm initial={data.settings} groups={GROUPS} />
    </div>
  );
}
