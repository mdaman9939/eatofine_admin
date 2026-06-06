"use client";

import { useState } from "react";

export interface Translation { locale: string; key: string; value: string }

const DEFAULT_LOCALES: Array<{ code: string; label: string }> = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
];

/**
 * Multi-language text field. Stores its value as a JSON string of
 * `[{ locale, key, value }]` translations (the same shape Laravel + the
 * restaurant app use). The first locale ("en") is the canonical value.
 */
export function MultiLangInput({
  value,
  onChange,
  label,
  fieldKey = "name",
  locales = DEFAULT_LOCALES,
}: {
  value: string;
  onChange: (jsonValue: string) => void;
  label: string;
  fieldKey?: string;
  locales?: Array<{ code: string; label: string }>;
}) {
  const initial = parseTranslations(value);
  const [active, setActive] = useState(locales[0].code);

  const byLocale: Record<string, string> = {};
  for (const t of initial) if (t.key === fieldKey) byLocale[t.locale] = t.value;

  function setValueFor(locale: string, v: string) {
    const next: Record<string, string> = { ...byLocale, [locale]: v };
    const arr: Translation[] = locales
      .filter((l) => (next[l.code] ?? "").trim() !== "")
      .map((l) => ({ locale: l.code, key: fieldKey, value: next[l.code] }));
    onChange(JSON.stringify(arr));
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{label}</span>
      <div className="flex gap-1 mb-1">
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setActive(l.code)}
            className={`text-xs px-2 py-1 rounded ${active === l.code ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      {locales.map((l) => (
        <input
          key={l.code}
          type="text"
          value={byLocale[l.code] ?? ""}
          onChange={(e) => setValueFor(l.code, e.target.value)}
          placeholder={`${label} (${l.label})`}
          className={`${active === l.code ? "block" : "hidden"} w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15`}
        />
      ))}
    </div>
  );
}

function parseTranslations(value: string | undefined): Translation[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
