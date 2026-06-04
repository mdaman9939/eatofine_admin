import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { PageEditor } from "./PageEditor";

interface Page {
  slug: string;
  title: string | null;
  content: string;
  updated_at: string | null;
}

export default async function PageEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await adminFetch<Page>(`/admin/pages/${slug}`);

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <Link href="/dashboard/pages" className="text-sm text-blue-600 hover:underline">
        ← All pages
      </Link>

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> CONTENT · LEGAL PAGE
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{page.title ?? slug}</h1>
          <p className="mt-1 text-xs text-white/70 font-mono">/{slug}</p>
        </div>
      </div>

      <PageEditor slug={slug} initialTitle={page.title ?? ""} initialContent={page.content} updatedAt={page.updated_at} />
    </div>
  );
}
