"use client";

/**
 * Client-side CSV export — builds a CSV from the columns + rows already on the
 * page and triggers a download, no extra endpoint needed. Used by every report
 * so the admin can export exactly what's on screen (Laravel parity: every
 * report list has an Excel/CSV export).
 */
export function CsvExportButton({
  columns,
  rows,
  filename = "report",
}: {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number | null | undefined>>;
  filename?: string;
}) {
  function escapeCell(v: string | number | null | undefined): string {
    const s = v === null || v === undefined ? "" : String(v);
    // Quote when the value contains a comma, quote, or newline.
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function onExport() {
    const header = columns.map((c) => escapeCell(c.label)).join(",");
    const body = rows.map((r) => columns.map((c) => escapeCell(r[c.key])).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={rows.length === 0}
      className="rounded-xl bg-white text-emerald-700 font-semibold text-sm px-4 py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ⬇ Export CSV
    </button>
  );
}
