"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface EditField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "checkbox" | "select" | "image";
  options?: Array<{ value: string; label: string }>;
  /** For type=image: which storage subdir to upload to (banner / advertisement / …). */
  imageDir?: string;
  /** For type=image: a value key holding the existing full image URL to preview
   *  (e.g. "image_full_url" when the row doesn't expose the raw filename). */
  previewField?: string;
}

/** Sentinel stored in form state to mark an image as explicitly removed. */
const REMOVE = "__REMOVE__";

/** Backend origin used to preview a freshly-uploaded image by its filename.
 *  Mirrors ImageUpload's resolution logic. */
function backendOrigin(): string {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) return envBase.replace(/\/api\/v1\/?$/, "");
  if (typeof window !== "undefined") return `${window.location.protocol}//${window.location.hostname}:3000`;
  return "https://eatofine-backend.onrender.com";
}

/**
 * Generic inline "Edit" button for any admin record. Opens a modal pre-filled
 * from `values`, PATCHes `/api/admin{basePath}/{id}` with the edited fields,
 * then refreshes the list. Reused across catalog/config entities so each list
 * page only declares its field list. Supports an `image` field type that
 * uploads a replacement and only submits the image when it actually changes.
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
      // image fields start "unchanged" (empty) — preview comes from `values`.
      else if (f.type === "image") s[f.name] = "";
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
      else if (f.type === "image") {
        // Only touch the image when the admin changed it: a new upload sends the
        // filename, an explicit remove clears it, otherwise we leave it untouched
        // so the existing image stays.
        if (v === "") continue;
        body[f.name] = v === REMOVE ? "" : v;
      } else body[f.name] = v;
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
                  ) : f.type === "image" ? (
                    <>
                      <span className="text-xs font-semibold text-slate-600">{f.label}</span>
                      <ImageEditField
                        dir={f.imageDir ?? "banner"}
                        state={String(form[f.name] ?? "")}
                        existingUrl={existingImageUrl(f, values)}
                        onChange={(v) => set(f.name, v)}
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-600">{f.label}</span>
                      <input
                        type={f.type === "date" ? "date" : "text"}
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

/** Resolve the current image URL to preview from the row, preferring an explicit
 *  full-URL field (e.g. image_full_url) and falling back to a raw filename. */
function existingImageUrl(f: EditField, values: Record<string, unknown>): string | null {
  if (f.previewField) {
    const url = values[f.previewField];
    if (typeof url === "string" && url) return url;
  }
  const raw = values[f.name];
  if (typeof raw === "string" && raw) {
    return raw.startsWith("http") || raw.startsWith("/") ? raw : `${backendOrigin()}/storage/${f.imageDir ?? "banner"}/${raw}`;
  }
  return null;
}

/** Inline uploader for the Edit modal: shows the current image, lets the admin
 *  replace it (uploads → returns a filename) or remove it. `state` is "" while
 *  unchanged, a filename after upload, or the REMOVE sentinel. */
function ImageEditField({
  dir,
  state,
  existingUrl,
  onChange,
}: {
  dir: string;
  state: string;
  existingUrl: string | null;
  onChange: (v: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const removed = state === REMOVE;
  const uploaded = state !== "" && state !== REMOVE;
  const previewUrl = uploaded
    ? `${backendOrigin()}/storage/${dir}/${state}`
    : removed
      ? null
      : existingUrl;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await fetch(`/api/admin/upload?dir=${encodeURIComponent(dir)}`, { method: "POST", body: fd });
      if (!res.ok) {
        setError((await res.text()).slice(0, 120));
        return;
      }
      const data = (await res.json()) as { filename: string };
      onChange(data.filename);
    });
  }

  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex items-center gap-2">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" className="w-16 h-16 rounded object-cover bg-slate-100 border border-slate-200" />
        ) : (
          <div className="w-16 h-16 rounded bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center px-1">no image</div>
        )}
        <div className="flex flex-col gap-1">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onPick}
            disabled={pending}
            className="text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-emerald-600 file:text-white file:px-2 file:py-1 file:text-xs"
          />
          <div className="flex items-center gap-2 text-[11px]">
            {pending && <span className="text-slate-500">uploading…</span>}
            {uploaded && <span className="text-emerald-600 font-semibold">new image ready</span>}
            {previewUrl && !pending && (
              <button type="button" onClick={() => onChange(REMOVE)} className="text-rose-600 hover:underline">Remove</button>
            )}
            {(uploaded || removed) && !pending && (
              <button type="button" onClick={() => onChange("")} className="text-slate-500 hover:underline">Undo</button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
