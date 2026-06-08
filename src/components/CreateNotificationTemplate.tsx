"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Create a brand-new notification template message. Saved as business-settings
 * keys (`notif_msg.<slug>.title|body|sms|_name`) so it shows up alongside the
 * built-in templates and is editable thereafter.
 */
export function CreateNotificationTemplate({ existingSlugs }: { existingSlugs: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sms, setSms] = useState("");

  function slugify(s: string) {
    return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const slug = slugify(name);
    if (!name.trim() || !slug) { setError("Template name is required"); return; }
    if (existingSlugs.includes(slug)) { setError("A template with this name already exists"); return; }
    if (!title.trim() && !body.trim() && !sms.trim()) { setError("Add a push title/body or SMS"); return; }

    const settings = [
      { key: `notif_msg.${slug}._name`, value: name.trim() },
      { key: `notif_msg.${slug}.title`, value: title },
      { key: `notif_msg.${slug}.body`, value: body },
      { key: `notif_msg.${slug}.sms`, value: sms },
    ];
    startTransition(async () => {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 200)); return; }
      setName(""); setTitle(""); setBody(""); setSms(""); setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-white text-emerald-700 text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
        Create notification template
      </button>
    );
  }

  const cls = "block w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">New notification template</h3>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Template name *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Festive Promo" className={cls} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Push title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🎉 Big festive offers!" className={cls} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Push body</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi {{customer_name}}, flat 30% off this weekend…" className={cls + " min-h-[70px]"} />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">SMS template</span>
        <textarea value={sms} onChange={(e) => setSms(e.target.value)} placeholder="Eatofine: Flat 30% off this weekend. Order now!" className={cls + " min-h-[50px]"} />
      </label>
      <p className="text-[11px] text-slate-400">Use merge tags like <code className="bg-slate-100 px-1 rounded">{`{{customer_name}}`}</code>.</p>
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" disabled={pending} className="rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 shadow-sm">
          {pending ? "Saving…" : "Create template"}
        </button>
      </div>
    </form>
  );
}
