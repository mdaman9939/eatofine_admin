"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
function findActiveItem(items: NavItem[], pathname: string): { href: string; label: string } | null {
  let best: { href: string; label: string } | null = null;
  const visit = (arr: NavItem[]) => {
    for (const item of arr) {
      // Only real routes can be the active leaf; "#parent-id" hrefs are
      // expand/collapse placeholders.
      if (item.href.startsWith("/")) {
        const matches =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
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

  // Single source of truth for "what route are we on?" — the longest prefix
  // match across the whole nav tree. Used for both the active-item highlight
  // and the page title.
  const active = findActiveItem(nav.flatMap((g) => g.items), pathname);
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
                placeholder="Search menu…"
                className="w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/45 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] focus:outline-none focus:border-white/30 focus:bg-white/10 focus:ring-2 focus:ring-white/10"
              />
              <svg className="w-4 h-4 text-white/55 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 min-h-0 px-3 pb-6 pt-1 space-y-5 overflow-y-auto scrollbar-premium">
            {nav.map((group, gi) => (
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
                    isParentOpen={isParentOpen}
                    toggleParent={toggleParent}
                  />
                ))}
              </div>
            ))}
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
                placeholder="Search…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-16 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              aria-label="Notifications"
              className="cursor-pointer p-2 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.16V11a6 6 0 10-12 0v3.16a2 2 0 01-.6 1.44L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <button
              type="button"
              aria-label="Cart"
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
