"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AccountMenu({
  fullName,
  role,
  email,
}: {
  fullName: string;
  role: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-blue-50 active:bg-blue-100 transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
          {initials(fullName)}
        </div>
        <div className="text-left leading-tight">
          <div className="text-sm font-semibold text-slate-800">{fullName}</div>
          <div className="text-xs text-slate-500">{role}</div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-100">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-base font-bold shrink-0">
              {initials(fullName)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{fullName}</div>
              <div className="text-xs text-slate-500 truncate">{email}</div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <MenuItem href="/dashboard/profile" onClick={() => setOpen(false)} icon={<UserIcon />} label="My Profile" />
            <MenuItem href="/dashboard/business-settings" onClick={() => setOpen(false)} icon={<SettingsIcon />} label="Settings" />
            <MenuItem href="/dashboard/faqs" onClick={() => setOpen(false)} icon={<HelpIcon />} label="Help & Support" />
          </div>

          <div className="border-t border-slate-100 py-2">
            <button
              type="button"
              onClick={logout}
              className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <LogoutIcon />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="cursor-pointer flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      <span className="text-slate-500">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317a1 1 0 011.35 0l.835.835a1 1 0 001.32.083l.99-.66a1 1 0 011.475.555l.34 1.13a1 1 0 00.97.71h1.18a1 1 0 01.97 1.265l-.34 1.13a1 1 0 00.555 1.21l1.04.52a1 1 0 010 1.79l-1.04.52a1 1 0 00-.555 1.21l.34 1.13a1 1 0 01-.97 1.265h-1.18a1 1 0 00-.97.71l-.34 1.13a1 1 0 01-1.475.555l-.99-.66a1 1 0 00-1.32.083l-.835.835a1 1 0 01-1.35 0l-.835-.835a1 1 0 00-1.32-.083l-.99.66a1 1 0 01-1.475-.555l-.34-1.13a1 1 0 00-.97-.71H4.49a1 1 0 01-.97-1.265l.34-1.13a1 1 0 00-.555-1.21l-1.04-.52a1 1 0 010-1.79l1.04-.52a1 1 0 00.555-1.21l-.34-1.13a1 1 0 01.97-1.265h1.18a1 1 0 00.97-.71l.34-1.13a1 1 0 011.475-.555l.99.66a1 1 0 001.32-.083l.835-.835z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.243 0 1.171 1.025 1.171 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.452 1.827V14m.01 3.013h.001M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
