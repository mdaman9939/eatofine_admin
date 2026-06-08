"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type FieldType = "text" | "number" | "color" | "select" | "checkbox" | "textarea" | "url" | "email";

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FieldGroup {
  title: string;
  description?: string;
  fields: FieldSpec[];
}

interface Setting {
  id: number;
  key: string;
  value: string | null;
}

/**
 * Field-type-aware editor for business_settings rows. Compared to the older
 * generic SettingsEditor, this one supports color pickers, selects,
 * checkboxes, and groups fields into named sections — so individual
 * "Theme Settings" / "App Settings" pages can describe their schema and
 * still share the same save plumbing.
 */
export function SettingsForm({ initial, groups }: { initial: Setting[]; groups: FieldGroup[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState<Record<string, string>>({});

  // Build a quick lookup of current value (initial DB value, fallback to schema default).
  function currentValue(key: string, fallback: string | undefined): string {
    if (dirty[key] !== undefined) return dirty[key];
    const found = initial.find((s) => s.key === key);
    if (found && found.value !== null) return typeof found.value === "string" ? found.value : String(found.value);
    return fallback ?? "";
  }

  function setValue(key: string, value: string) {
    setDirty((d) => ({ ...d, [key]: value }));
  }

  function save() {
    if (Object.keys(dirty).length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          settings: Object.entries(dirty).map(([key, value]) => ({ key, value })),
        }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setDirty({});
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Action bar — sticky at top of page so save is always reachable */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3 text-sm">
          {Object.keys(dirty).length > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {Object.keys(dirty).length} unsaved change{Object.keys(dirty).length === 1 ? "" : "s"}
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Saved at {savedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            <span className="text-slate-500">No changes</span>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending || Object.keys(dirty).length === 0}
          className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 shadow-sm hover:shadow transition-all"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 text-sm">{error}</div>
      )}

      {/* Sections — each group is a full-width card whose fields flow in a
          responsive grid so the page uses the whole width (no dead space). */}
      {groups.map((group) => (
        <div key={group.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{group.title}</h2>
            {group.description && <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>}
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-5">
            {group.fields.map((f) => (
              <FieldCell
                key={f.key}
                spec={f}
                value={currentValue(f.key, f.defaultValue)}
                isDirty={dirty[f.key] !== undefined}
                onChange={(v) => setValue(f.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldCell({
  spec, value, isDirty, onChange,
}: { spec: FieldSpec; value: string; isDirty: boolean; onChange: (v: string) => void }) {
  // Textareas get the full row so the editor is comfortably wide.
  const fullWidth = spec.type === "textarea";
  return (
    <div className={fullWidth ? "md:col-span-2 2xl:col-span-3" : ""}>
      <label className="block">
        <span className="font-medium text-sm text-slate-900">{spec.label}</span>
        {isDirty && (
          <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            Modified
          </span>
        )}
      </label>
      {spec.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{spec.description}</p>}
      <p className="text-[10px] text-slate-400 font-mono mt-0.5 mb-2">{spec.key}</p>
      <Input spec={spec} value={value} onChange={onChange} />
    </div>
  );
}

function Input({ spec, value, onChange }: { spec: FieldSpec; value: string; onChange: (v: string) => void }) {
  const inputCls = "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all";

  if (spec.type === "checkbox") {
    const checked = value === "true" || value === "1" || value === "on";
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        />
        <span className="text-sm text-slate-700">{checked ? "Enabled" : "Disabled"}</span>
      </label>
    );
  }
  if (spec.type === "select") {
    return (
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Select —</option>
        {spec.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (spec.type === "color") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#10b981"}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={spec.placeholder ?? "#10b981"}
          className={`${inputCls} font-mono uppercase`}
        />
      </div>
    );
  }
  if (spec.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={spec.placeholder}
        className={`${inputCls} min-h-[80px]`}
      />
    );
  }
  if (spec.type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={spec.placeholder}
        min={0}
        step="any"
        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
        className={inputCls}
      />
    );
  }
  // text, url, email all use the same input — type attribute differs
  return (
    <input
      type={spec.type === "url" ? "url" : spec.type === "email" ? "email" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={spec.placeholder}
      className={inputCls}
    />
  );
}
