"use client";

import { PageButton, PageWindow } from "./PaginatedTable";

/**
 * Standalone pagination footer for tables that keep their own custom toolbar /
 * `<tfoot>` totals and so can't use the all-in-one <PaginatedTable>. Drop it
 * directly below the table; it only renders when there's more than one page.
 *
 *   const [page, setPage] = useState(1);
 *   const pageSize = 15;
 *   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
 *   const safePage = Math.min(page, totalPages);
 *   const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
 *   ...render pageRows...
 *   <TablePager page={safePage} totalPages={totalPages} total={filtered.length}
 *               pageSize={pageSize} onPage={setPage} />
 */
export function TablePager({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  filtered = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  filtered?: boolean;
}) {
  if (total <= pageSize) return null;
  const start = (page - 1) * pageSize;
  return (
    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">
      <div className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700 tabular-nums">{start + 1}</span>
        {" – "}
        <span className="font-semibold text-slate-700 tabular-nums">{Math.min(start + pageSize, total)}</span>
        {" of "}
        <span className="font-semibold text-slate-700 tabular-nums">{total}</span>
        {filtered && <span className="text-slate-400"> (filtered)</span>}
      </div>
      <div className="inline-flex items-center gap-1">
        <PageButton disabled={page === 1} onClick={() => onPage(1)} label="« First" />
        <PageButton disabled={page === 1} onClick={() => onPage(page - 1)} label="‹ Prev" />
        <PageWindow current={page} total={totalPages} onJump={onPage} />
        <PageButton disabled={page === totalPages} onClick={() => onPage(page + 1)} label="Next ›" />
        <PageButton disabled={page === totalPages} onClick={() => onPage(totalPages)} label="Last »" />
      </div>
    </div>
  );
}
