"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Parse a CSV string into rows of header-keyed objects. Handles quoted
 *  cells and doubled-quote escapes. Limited but enough for the admin's
 *  bulk-import flow (small CSVs, pasted from Excel / Google Sheets). */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  function splitLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { out.push(cur); cur = ""; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out;
  }

  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = (cells[j] ?? "").trim(); });
    rows.push(row);
  }
  return rows;
}

/** Coerce numeric-looking strings to numbers, booleans to booleans, so
 *  the backend gets typed values instead of all-string CSV cells. */
function coerce(row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === "") continue;
    if (/^-?\d+(\.\d+)?$/.test(v)) out[k] = parseFloat(v);
    else if (/^(true|false)$/i.test(v)) out[k] = /^true$/i.test(v);
    else out[k] = v;
  }
  return out;
}

export function BulkImportPanel({ endpoint, requiredHeader }: { endpoint: string; requiredHeader: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<{ inserted: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null); setResult(null);
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      setError("No rows parsed. Did you include a header row?");
      return;
    }
    const required = requiredHeader.split(",").map((s) => s.trim());
    const missing = required.filter((r) => !(r in rows[0]));
    if (missing.length > 0) {
      setError(`Missing required column(s): ${missing.join(", ")}`);
      return;
    }
    const coerced = rows.map(coerce);
    startTransition(async () => {
      const res = await fetch(`/api/admin${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: coerced }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      const data = await res.json() as { inserted: number; failed: number; total: number };
      setResult(data);
      setCsvText("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={`name,email,phone,address\nPizza Hub,owner@pizzahub.com,+919999900001,Sector 12\n…`}
        className="block w-full min-h-[180px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
        spellCheck={false}
      />
      {error && <div className="rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-3 py-2 text-xs">{error}</div>}
      {result && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 text-xs">
          ✓ Imported <strong>{result.inserted}</strong> of <strong>{result.total}</strong> rows
          {result.failed > 0 && <span> · <strong>{result.failed}</strong> failed</span>}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !csvText.trim()}
          className="cursor-pointer rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 shadow-sm"
        >
          {pending ? "Importing…" : "Import CSV"}
        </button>
      </div>
    </div>
  );
}
