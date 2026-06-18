"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface EditField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "checkbox" | "select";
  options?: Array<{ value: string; label: string }>;
}

/**
 * Generic inline "Edit" button for any admin record. Opens a modal pre-filled
 * from `values`, PATCHes `/api/admin{basePath}/{id}` with the edited fields,
 * then refreshes the list. Reused across catalog/config entities so each list
 * page only declares its field list.
 */
export function EditRecordButton({
  basePath,
  id,
  title,
  fields,
  values,
}: {
  basePath: string;
  id: number | string;
  title?: string;
  fields: EditField[];
  values: Record<string, unknown>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const seed = () => {
    const s: Record<string, string | boolean> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.type === "checkbox") s[f.name] = !!v;
      else if (f.type === "date") s[f.name] = v ? String(v).slice(0, 10) : "";
      else s[f.name] = v == null ? "" : String(v);
    }
    return s;
  };
  const [form, setForm] = useState<Record<string, string | boolean>>(seed);

  function openModal() {
    setForm(seed());
    setError(null);
    setOpen(true);
  }
  function set(name: string, v: string | boolean) {
    setForm((f) => ({ ...f, [name]: v }));
  }
  function save() {
    setError(null);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = form[f.name];
      if (f.type === "number") body[f.name] = v === "" ? null : Number(v);
      else body[f.name] = v;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin${basePath}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 140));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const inputCls = "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 text-xs font-semibold"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-3">{title ?? "Edit"} #{id}</h3>
            <div className="space-y-3 text-left">
              {fields.map((f) => (
                <label key={f.name} className={f.type === "checkbox" ? "flex items-center gap-2" : "block"}>
                  {f.type === "checkbox" ? (
                    <>
                      <input type="checkbox" checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                      <span className="text-xs font-semibold text-slate-600">{f.label}</span>
                    </>
                  ) : f.type === "select" ? (
                    <>
                      <span className="text-xs font-semibold text-slate-600">{f.label}</span>
                      <select value={String(form[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} className={inputCls}>
                        {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-600">{f.label}</span>
                      <input
                        type={f.type === "date" ? "date" : f.type === "number" ? "text" : "text"}
                        inputMode={f.type === "number" ? "decimal" : undefined}
                        value={String(form[f.name] ?? "")}
                        onChange={(e) => set(f.name, e.target.value)}
                        className={inputCls}
                      />
                    </>
                  )}
                </label>
              ))}
            </div>

            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 mt-3">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2">
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
