import Link from "next/link";
import { PlaceholderPage } from "../../../components/PlaceholderPage";

const PAGES = [
  { slug: "terms-and-conditions", title: "Terms & Conditions", description: "Legal terms governing platform usage" },
  { slug: "privacy-policy", title: "Privacy Policy", description: "How customer data is collected, used, stored" },
  { slug: "about-us", title: "About Us", description: "Company story, mission, team" },
  { slug: "refund-policy", title: "Refund Policy", description: "When and how refunds are processed" },
  { slug: "shipping-policy", title: "Shipping Policy", description: "Delivery zones, ETAs, charges" },
  { slug: "cancellation-policy", title: "Cancellation Policy", description: "How customers cancel and what fees apply" },
];

export default function ContentPagesPage() {
  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> CONTENT · LEGAL PAGES
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Public Pages</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Markdown / WYSIWYG editable pages shown on the public marketing site. Each page is per-locale and supports HTML embeds for tables, contact addresses, and signed PDFs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/dashboard/pages/${p.slug}`}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.description}</p>
              </div>
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px]">
                /{p.slug}
              </span>
              <span className="text-slate-400">Last edited —</span>
            </div>
          </Link>
        ))}
      </div>

      <PlaceholderPage
        badge="EDITOR · COMING UP"
        title="Per-page editor"
        description="Click any page above to open its WYSIWYG editor with per-locale tabs."
        capabilities={[
          { title: "Markdown + rich text", description: "Both modes supported with live preview." },
          { title: "Per-locale tabs", description: "Edit the same page in English / Hindi / Arabic / etc." },
          { title: "Auto-save drafts", description: "Recover from accidental browser close." },
          { title: "Audit trail", description: "Who changed what, when — visible in the page's history tab." },
        ]}
      />
    </div>
  );
}
