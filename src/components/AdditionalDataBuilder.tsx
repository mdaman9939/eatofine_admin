"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// One custom field shown on the restaurant-app sign-up "Additional Data"
// section. Shape MUST match what the Flutter config model parses
// (`restaurant_additional_join_us_page_data.data[]`):
//   field_type:  text | number | email | phone | date | check_box | file
//   input_data:  stable snake_case key the answer is stored under
//   placeholder_data: human label shown on the field
//   is_required: 0 | 1
//   check_data:  options (check_box only)
//   media_data:  allowed upload types (file only)
type FieldType = "text" | "number" | "email" | "phone" | "date" | "check_box" | "file";

interface MediaData {
  upload_multiple_files: number;
  image: number;
  pdf: number;
  docs: number;
}

interface JoinField {
  field_type: FieldType;
  input_data: string;
  placeholder_data: string;
  is_required: number;
  check_data?: string[];
  media_data?: MediaData;
}

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "check_box", label: "Checkbox (multiple options)" },
  { value: "file", label: "File upload" },
];

const DEFAULT_MEDIA: MediaData = { upload_multiple_files: 0, image: 1, pdf: 1, docs: 1 };

/** Derive a stable snake_case key from a human label. */
function toKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseInitial(raw: string | null): JoinField[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { data?: JoinField[] };
    if (Array.isArray(parsed?.data)) return parsed.data;
  } catch {
    /* malformed — start empty */
  }
  return [];
}

export function AdditionalDataBuilder({ initialValue }: { initialValue: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState<JoinField[]>(() => parseInitial(initialValue));
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  const savedSnapshot = useMemo(() => JSON.stringify(parseInitial(initialValue)), [initialValue]);
  const isDirty = dirty && JSON.stringify(fields) !== savedSnapshot;

  function mutate(next: JoinField[]) {
    setFields(next);
    setDirty(true);
    setSavedAt(null);
  }

  function addField() {
    mutate([
      ...fields,
      { field_type: "text", input_data: "", placeholder_data: "", is_required: 0 },
    ]);
  }

  function removeField(i: number) {
    mutate(fields.filter((_, idx) => idx !== i));
  }

  function patch(i: number, change: Partial<JoinField>) {
    mutate(fields.map((f, idx) => (idx === i ? { ...f, ...change } : f)));
  }

  function changeType(i: number, type: FieldType) {
    const f = fields[i];
    const next: JoinField = { ...f, field_type: type };
    if (type === "check_box") {
      next.check_data = f.check_data?.length ? f.check_data : [""];
      delete next.media_data;
    } else if (type === "file") {
      next.media_data = f.media_data ?? { ...DEFAULT_MEDIA };
      delete next.check_data;
    } else {
      delete next.check_data;
      delete next.media_data;
    }
    patch(i, next);
  }

  function validate(): string | null {
    const keys = new Set<string>();
    for (const f of fields) {
      if (!f.placeholder_data.trim()) return "Every field needs a label.";
      const key = f.input_data.trim() || toKey(f.placeholder_data);
      if (!key) return `Field "${f.placeholder_data}" needs a key.`;
      if (keys.has(key)) return `Duplicate field key "${key}". Keys must be unique.`;
      keys.add(key);
      if (f.field_type === "check_box" && !(f.check_data ?? []).some((o) => o.trim())) {
        return `Checkbox field "${f.placeholder_data}" needs at least one option.`;
      }
    }
    return null;
  }

  function save() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    // Normalise before persisting: fill keys, drop empty checkbox options.
    const normalised = fields.map((f) => {
      const out: JoinField = {
        field_type: f.field_type,
        input_data: (f.input_data.trim() || toKey(f.placeholder_data)),
        placeholder_data: f.placeholder_data.trim(),
        is_required: f.is_required ? 1 : 0,
      };
      if (f.field_type === "check_box") out.check_data = (f.check_data ?? []).map((o) => o.trim()).filter(Boolean);
      if (f.field_type === "file") out.media_data = f.media_data ?? { ...DEFAULT_MEDIA };
      return out;
    });

    startTransition(async () => {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          settings: [
            {
              key: "restaurant_additional_join_us_page_data",
              value: JSON.stringify({ data: normalised }),
            },
          ],
        }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setDirty(false);
      setSavedAt(new Date());
      router.refresh();
    });
  }

  const inputCls =
    "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Additional data (custom sign-up fields)</h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Extra fields shown under “Additional Data” on the restaurant app’s registration form. Leave empty to hide
            the section. Stored in{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">restaurant_additional_join_us_page_data</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved changes
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={pending || !isDirty}
            className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 shadow-sm transition-all"
          >
            {pending ? "Saving…" : "Save fields"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="p-5 space-y-4">
        {fields.length === 0 && (
          <p className="text-sm text-slate-500 italic">No custom fields. The “Additional Data” section is hidden in the app.</p>
        )}

        {fields.map((f, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Field {i + 1}</span>
              <button
                type="button"
                onClick={() => removeField(i)}
                className="cursor-pointer text-rose-600 hover:text-rose-700 text-xs font-semibold inline-flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Field type</span>
                <select
                  className={`${inputCls} mt-1`}
                  value={f.field_type}
                  onChange={(e) => changeType(i, e.target.value as FieldType)}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Label (shown to user)</span>
                <input
                  className={`${inputCls} mt-1`}
                  value={f.placeholder_data}
                  placeholder="e.g. GST Number"
                  onChange={(e) => {
                    const label = e.target.value;
                    // Auto-fill key from the label until the admin edits it.
                    const autoKey = !f.input_data || f.input_data === toKey(f.placeholder_data);
                    patch(i, { placeholder_data: label, ...(autoKey ? { input_data: toKey(label) } : {}) });
                  }}
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Field key (saved as)</span>
                <input
                  className={`${inputCls} mt-1 font-mono`}
                  value={f.input_data}
                  placeholder="gst_number"
                  onChange={(e) => patch(i, { input_data: toKey(e.target.value) })}
                />
              </label>
            </div>

            {f.field_type === "check_box" && (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <span className="text-xs font-medium text-slate-700">Checkbox options</span>
                <div className="mt-2 space-y-2">
                  {(f.check_data ?? []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        value={opt}
                        placeholder={`Option ${oi + 1}`}
                        onChange={(e) =>
                          patch(i, {
                            check_data: (f.check_data ?? []).map((o, idx) => (idx === oi ? e.target.value : o)),
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => patch(i, { check_data: (f.check_data ?? []).filter((_, idx) => idx !== oi) })}
                        className="cursor-pointer text-slate-400 hover:text-rose-600"
                        aria-label="Remove option"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => patch(i, { check_data: [...(f.check_data ?? []), ""] })}
                    className="cursor-pointer text-emerald-700 hover:text-emerald-800 text-xs font-semibold"
                  >
                    + Add option
                  </button>
                </div>
              </div>
            )}

            {f.field_type === "file" && (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <span className="text-xs font-medium text-slate-700">Allowed uploads</span>
                <div className="mt-2 flex flex-wrap gap-4">
                  {([
                    ["image", "Images"],
                    ["pdf", "PDF"],
                    ["docs", "Docs"],
                    ["upload_multiple_files", "Allow multiple"],
                  ] as Array<[keyof MediaData, string]>).map(([k, label]) => {
                    const media = f.media_data ?? { ...DEFAULT_MEDIA };
                    return (
                      <label key={k} className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!media[k]}
                          onChange={(e) => patch(i, { media_data: { ...media, [k]: e.target.checked ? 1 : 0 } })}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!f.is_required}
                onChange={(e) => patch(i, { is_required: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              />
              Required field
            </label>
          </div>
        ))}

        <button
          type="button"
          onClick={addField}
          className="cursor-pointer w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-700 text-sm font-semibold py-3 transition-all"
        >
          + Add field
        </button>
      </div>
    </div>
  );
}
