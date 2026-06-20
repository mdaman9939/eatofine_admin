"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { SidebarIcon } from "./SidebarIcon";

export interface NavItem {
  href: string;
  label: string;
  badge?: string;
  icon?: string;
  /** If set, this item is a parent. Clicking it expands/collapses, doesn't navigate. */
  children?: NavItem[];
}

export interface NavGroup {
  section: string | null;
  items: NavItem[];
}

// Walk the whole nav tree, find the navigable item whose href best matches
// the current pathname (longest prefix wins). Returns null if nothing matches.
function findActiveItem(items: NavItem[], pathname: string, currentType: string | null): { href: string; label: string } | null {
  let best: { href: string; label: string } | null = null;
  const visit = (arr: NavItem[]) => {
    for (const item of arr) {
      // Only real routes can be the active leaf; "#parent-id" hrefs are
      // expand/collapse placeholders.
      if (item.href.startsWith("/")) {
        const [itemPath, itemQuery] = item.href.split("?");
        let matches: boolean;
        if (itemQuery) {
          // Query-filtered item (e.g. /dashboard/orders?type=dine_in): active
          // only when the path AND its `type` filter both match the URL — so
          // Take Away / Dine In / Home Delivery highlight on their own page.
          const itemType = new URLSearchParams(itemQuery).get("type");
          matches = pathname === itemPath && currentType === itemType;
        } else {
          // Plain route. The "All Orders" variant (/dashboard/orders) must NOT
          // stay active when a `type` filter is on — let the filtered sibling win.
          const pathMatches =
            pathname === itemPath || (itemPath !== "/dashboard" && pathname.startsWith(itemPath + "/"));
          matches = pathMatches && !(itemPath === "/dashboard/orders" && !!currentType);
        }
        // Longer href = more specific → wins the tie (filtered beats plain).
        if (matches && (!best || item.href.length > best.href.length)) {
          best = { href: item.href, label: item.label };
        }
      }
      if (item.children) visit(item.children);
    }
  };
  visit(items);
  return best;
}

function isItemActive(item: NavItem, activeHref: string | null): boolean {
  return activeHref !== null && item.href === activeHref;
}

function anyChildActive(item: NavItem, activeHref: string | null): boolean {
  if (!item.children || activeHref === null) return false;
  return item.children.some(
    (c) => c.href === activeHref || anyChildActive(c, activeHref),
  );
}

// ── Search helpers ─────────────────────────────────────────────────
// Filter the nav tree to items whose label (or a descendant's label) matches
// the query. A parent whose own label matches keeps its full subtree; otherwise
// only its matching children are retained.
function filterNavItem(item: NavItem, q: string): NavItem | null {
  const selfMatch = item.label.toLowerCase().includes(q);
  if (item.children?.length) {
    if (selfMatch) return item;
    const kids = item.children
      .map((c) => filterNavItem(c, q))
      .filter((c): c is NavItem => c !== null);
    return kids.length ? { ...item, children: kids } : null;
  }
  return selfMatch ? item : null;
}

function filterNavTree(groups: NavGroup[], query: string): NavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items
        .map((i) => filterNavItem(i, q))
        .filter((i): i is NavItem => i !== null),
    }))
    .filter((g) => g.items.length > 0);
}

// Flat index of every navigable leaf page (href starts with "/"), each with a
// breadcrumb trail for context in the command palette. Duplicate (href+label)
// pairs are collapsed so the same page isn't listed twice.
export interface FlatNavEntry { href: string; label: string; trail: string }
function flattenNav(groups: NavGroup[]): FlatNavEntry[] {
  const out: FlatNavEntry[] = [];
  const seen = new Set<string>();
  for (const g of groups) {
    const walk = (items: NavItem[], trail: string[]) => {
      for (const item of items) {
        if (item.children?.length) {
          walk(item.children, [...trail, item.label]);
        } else if (item.href.startsWith("/")) {
          const key = `${item.href}|${item.label}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            href: item.href,
            label: item.label,
            trail: [g.section, ...trail].filter(Boolean).join(" › "),
          });
        }
      }
    };
    walk(g.items, []);
  }
  return out;
}

export function AdminShell({
  nav,
  fullName,
  role,
  email = "admin@admin.com",
  brandName,
  tagline,
  children,
}: {
  nav: NavGroup[];
  fullName: string;
  role: string;
  email?: string;
  brandName?: string;
  tagline?: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");
  const router = useRouter();

  // Sidebar menu filter — narrows the visible nav tree by label.
  const [navQuery, setNavQuery] = useState("");
  const searching = navQuery.trim().length > 0;
  const displayNav = useMemo(
    () => (searching ? filterNavTree(nav, navQuery) : nav),
    [nav, navQuery, searching],
  );

  // Command palette (Ctrl/⌘ + K) — jump to any page.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const flatNav = useMemo(() => flattenNav(nav), [nav]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Single source of truth for "what route are we on?" — the longest prefix
  // match across the whole nav tree (now query-aware for ?type= filters). Used
  // for both the active-item highlight and the page title.
  const active = findActiveItem(nav.flatMap((g) => g.items), pathname, currentType);
  const activeHref = active?.href ?? null;

  const pageTitle = pathname === "/dashboard" ? "Home" : active?.label ?? "Dashboard";

  // Single source of truth for which parents are expanded. Auto-open a
  // parent the first time the user navigates into one of its children, then
  // let them toggle freely without the route fighting the click.
  // The lazy initializer seeds the SSR HTML so there's no expand-flicker on
  // first paint; the useEffect handles subsequent client-side navigations.
  const [openParents, setOpenParents] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const walk = (items: NavItem[]) => {
      for (const item of items) {
        if (item.children?.length) {
          if (anyChildActive(item, activeHref)) initial.add(item.href);
          walk(item.children);
        }
      }
    };
    for (const g of nav) walk(g.items);
    return initial;
  });

  useEffect(() => {
    setOpenParents((prev) => {
      const next = new Set(prev);
      let changed = false;
      const walk = (items: NavItem[]) => {
        for (const item of items) {
          if (item.children?.length) {
            if (anyChildActive(item, activeHref) && !next.has(item.href)) {
              next.add(item.href);
              changed = true;
            }
            walk(item.children);
          }
        }
      };
      for (const g of nav) walk(g.items);
      return changed ? next : prev;
    });
  }, [activeHref, nav]);

  const isParentOpen = (item: NavItem) => openParents.has(item.href);
  const toggleParent = (href: string) =>
    setOpenParents((s) => {
      const next = new Set(s);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });

  return (
    <div className="h-screen flex bg-slate-100 text-slate-800 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`${collapsed ? "w-0" : "w-64"} sidebar-gradient flex flex-col shrink-0 overflow-hidden transition-[width] duration-300 ease-out shadow-[4px_0_24px_-12px_rgba(15,23,42,0.6)]`}
      >
        <div className="w-64 flex flex-col h-full text-white">
          {/* Brand block */}
          <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(brandName ?? "E").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-white leading-tight truncate">{brandName ?? "Eatofine"}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-medium mt-0.5">{tagline ?? "Admin Panel"}</div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pt-4 pb-3 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
                placeholder="Search menu…"
                className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm pl-9 pr-8 py-2.5 text-sm text-white placeholder-white/45 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/10"
              />
              <svg className="w-4 h-4 text-white/55 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
              {searching && (
                <button
                  type="button"
                  onClick={() => setNavQuery("")}
                  aria-label="Clear menu search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/55 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 min-h-0 px-3 pb-6 pt-1 space-y-5 overflow-y-auto scrollbar-premium">
            {displayNav.map((group, gi) => (
              <div key={group.section ?? `g-${gi}`} className="space-y-1">
                {group.section && (
                  <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">
                    {group.section}
                  </div>
                )}
                {group.items.map((item) => (
                  <NavNode
                    key={item.href}
                    item={item}
                    activeHref={activeHref}
                    depth={0}
                    isParentOpen={searching ? () => true : isParentOpen}
                    toggleParent={toggleParent}
                  />
                ))}
              </div>
            ))}
            {searching && displayNav.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-white/50">
                No menu items match &ldquo;{navQuery}&rdquo;.
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 shrink-0">
          {/* Sidebar toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="cursor-pointer p-2 rounded-md text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors shrink-0"
            aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
            title={collapsed ? "Open sidebar" : "Close sidebar"}
          >
            {collapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>

          <h1 className="text-base font-semibold text-slate-900 shrink-0 mr-2">{pageTitle}</h1>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search pages…"
                readOnly
                value=""
                onClick={() => setPaletteOpen(true)}
                onFocus={() => setPaletteOpen(true)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-16 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">
                Ctrl+K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => router.push("/dashboard/contact-messages")}
              aria-label="Messages"
              title="Messages"
              className="cursor-pointer p-2 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.16V11a6 6 0 10-12 0v3.16a2 2 0 01-.6 1.44L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/pos")}
              aria-label="POS"
              title="POS"
              className="cursor-pointer p-2 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>

            <AccountMenu fullName={fullName} role={role} email={email} />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-hide">
          {children}
        </main>
      </div>

      {paletteOpen && (
        <CommandPalette
          items={flatNav}
          onClose={() => setPaletteOpen(false)}
          onNavigate={(href) => {
            setPaletteOpen(false);
            router.push(href);
          }}
        />
      )}
    </div>
  );
}

// Ctrl/⌘+K command palette: fuzzy-filters every navigable page by label/trail,
// supports keyboard (↑/↓/Enter/Esc) and click navigation.
function CommandPalette({
  items,
  onClose,
  onNavigate,
}: {
  items: FlatNavEntry[];
  onClose: () => void;
  onNavigate: (href: string) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items.slice(0, 50);
    return items
      .filter((it) => it.label.toLowerCase().includes(query) || it.trail.toLowerCase().includes(query))
      .slice(0, 50);
  }, [q, items]);

  // Keep the highlighted row in view during keyboard navigation.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = results[active];
      if (sel) onNavigate(sel.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-slate-100">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0); // reset highlight on every query change
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages… (e.g. TDS, coupons, reports)"
            className="flex-1 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No pages match &ldquo;{q}&rdquo;.</div>
          ) : (
            results.map((it, i) => (
              <button
                key={`${it.href}|${it.label}`}
                ref={i === active ? activeRef : undefined}
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => onNavigate(it.href)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                  i === active ? "bg-emerald-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">{it.label}</span>
                  {it.trail && <span className="block text-[11px] text-slate-400 truncate">{it.trail}</span>}
                </span>
                <span className="text-[10px] text-slate-300 font-mono truncate shrink-0">
                  {it.href.replace("/dashboard", "") || "/"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NavNode({
  item,
  activeHref,
  depth,
  isParentOpen,
  toggleParent,
}: {
  item: NavItem;
  activeHref: string | null;
  depth: number;
  isParentOpen: (item: NavItem) => boolean;
  toggleParent: (href: string) => void;
}) {
  const hasChildren = !!item.children && item.children.length > 0;
  const active = isItemActive(item, activeHref);
  const childActive = anyChildActive(item, activeHref);
  const open = hasChildren && isParentOpen(item);

  const isChild = depth > 0;
  // Children sit inside a guide-line wrapper, so they only need a small
  // right padding here.
  const padX = isChild ? "pl-3 pr-3" : "px-3";

  // Parent: button that expands/collapses (no navigation).
  if (hasChildren) {
    return (
      <div className="group/parent">
        <button
          type="button"
          onClick={() => toggleParent(item.href)}
          className={`cursor-pointer w-full flex items-center justify-between ${padX} py-2.5 rounded-xl text-sm transition-all duration-300 ease-out ${
            childActive
              ? "bg-white/10 backdrop-blur-sm text-white ring-1 ring-white/10"
              : "text-white/85 hover:bg-white/[0.07] hover:text-white hover:translate-x-0.5"
          }`}
          aria-expanded={open}
        >
          <span className="flex items-center gap-3 min-w-0">
            <SidebarIcon name={item.icon} className={`shrink-0 transition-transform duration-300 ${isChild ? "w-3.5 h-3.5" : "w-[18px] h-[18px]"} ${childActive ? "text-white" : "text-white/70 group-hover/parent:text-white"}`} />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            {item.badge && (
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-white/95 text-emerald-700 shadow-sm tracking-wide">
                {item.badge}
              </span>
            )}
            <svg
              className={`w-3.5 h-3.5 text-white/55 transition-transform duration-300 ease-out ${open ? "rotate-180 text-white/85" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
        {open && (
          <div className="mt-1 ml-[18px] pl-3 border-l border-white/10 space-y-0.5">
            {item.children!.map((child) => (
              <NavNode
                key={child.href}
                item={child}
                activeHref={activeHref}
                depth={depth + 1}
                isParentOpen={isParentOpen}
                toggleParent={toggleParent}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Leaf: a normal link.
  return (
    <Link
      href={item.href}
      className={`group/leaf relative flex items-center justify-between ${padX} py-2.5 rounded-xl text-sm transition-all duration-300 ease-out ${
        active
          ? "bg-white/15 backdrop-blur-md text-white font-medium shadow-[0_4px_16px_-4px_rgba(16,185,129,0.6)] ring-1 ring-white/15"
          : "text-white/85 hover:bg-white/[0.07] hover:text-white hover:translate-x-0.5"
      }`}
    >
      {/* Left accent indicator on active */}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]"
        />
      )}
      <span className="flex items-center gap-3 min-w-0">
        <SidebarIcon
          name={item.icon}
          className={`shrink-0 transition-transform duration-300 ${isChild ? "w-3.5 h-3.5" : "w-[18px] h-[18px]"} ${active ? "text-white" : "text-white/70 group-hover/leaf:text-white"}`}
        />
        <span className="truncate">{item.label}</span>
      </span>
      {item.badge && (
        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-white/95 text-emerald-700 shadow-sm tracking-wide shrink-0">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
