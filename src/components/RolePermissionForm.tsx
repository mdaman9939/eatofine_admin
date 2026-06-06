"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * The full set of admin-panel permission modules, mirroring Laravel's
 * `module_permission_check('<key>')` keys. A role stores the subset it can
 * access; the sidebar/pages gate on these. Grouped only for display.
 */
export const PERMISSION_GROUPS: Array<{ group: string; modules: Array<{ key: string; label: string }> }> = [
  {
    group: "Orders",
    modules: [
      { key: "pos", label: "POS" },
      { key: "order", label: "Orders" },
      { key: "dispatch", label: "Dispatch" },
      { key: "refund", label: "Refunds" },
    ],
  },
  {
    group: "Catalog",
    modules: [
      { key: "zone", label: "Zones" },
      { key: "restaurant", label: "Restaurants" },
      { key: "category", label: "Categories" },
      { key: "addon", label: "Add-ons" },
      { key: "food", label: "Foods" },
      { key: "attribute", label: "Attributes" },
    ],
  },
  {
    group: "Promotions",
    modules: [
      { key: "campaign", label: "Campaigns" },
      { key: "coupon", label: "Coupons" },
      { key: "cashback", label: "Cashback" },
      { key: "banner", label: "Banners" },
      { key: "advertisement", label: "Advertisements" },
      { key: "notification", label: "Push notifications" },
    ],
  },
  {
    group: "People",
    modules: [
      { key: "customerList", label: "Customers" },
      { key: "customer_wallet", label: "Customer wallet" },
      { key: "deliveryman", label: "Delivery men" },
      { key: "employee", label: "Employees" },
      { key: "custom_role", label: "Roles" },
    ],
  },
  {
    group: "Finance",
    modules: [
      { key: "disbursement", label: "Disbursements" },
      { key: "account", label: "Collect cash" },
      { key: "withdraw_list", label: "Withdraws" },
      { key: "provide_dm_earning", label: "DM payments" },
      { key: "report", label: "Reports" },
    ],
  },
  {
    group: "Support & system",
    modules: [
      { key: "chat", label: "Chattings" },
      { key: "contact_message", label: "Contact messages" },
      { key: "settings", label: "Business settings" },
      { key: "system_settings", label: "System settings" },
      { key: "system_addon", label: "System addons" },
    ],
  },
];

const ALL_KEYS = PERMISSION_GROUPS.flatMap((g) => g.modules.map((m) => m.key));

export function RolePermissionForm({
  mode = "create",
  roleId,
  initialName = "",
  initialModules = [],
}: {
  mode?: "create" | "edit";
  roleId?: number;
  initialName?: string;
  initialModules?: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(initialName);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialModules));

  const allChecked = ALL_KEYS.every((k) => selected.has(k));

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(ALL_KEYS));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    const body = { name: name.trim(), modules: JSON.stringify(Array.from(selected)) };
    const path = mode === "edit" ? `/admin-roles/${roleId}` : "/admin-roles";
    startTransition(async () => {
      const res = await fetch(`/api/admin${path}`, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setSaved(true);
      if (mode === "create") {
        setName("");
        setSelected(new Set());
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <label className="block flex-1 min-w-[220px]">
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Role name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Store Manager"
            className="block w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
          />
        </label>
        <button
          type="button"
          onClick={toggleAll}
          className="cursor-pointer rounded-md px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
        >
          {allChecked ? "Clear all" : "Select all"} ({selected.size}/{ALL_KEYS.length})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g.group} className="rounded-xl border border-slate-200 p-3">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-2">{g.group}</div>
            <div className="space-y-1.5">
              {g.modules.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={selected.has(m.key)}
                    onChange={() => toggle(m.key)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  />
                  <span className="text-slate-700 group-hover:text-slate-900">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2">{error}</p>}
      {saved && !error && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">Saved.</p>}

      <div className="flex gap-2 justify-end">
        {mode === "edit" && (
          <button type="button" onClick={() => router.back()} className="cursor-pointer rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 shadow-sm"
        >
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create role"}
        </button>
      </div>
    </form>
  );
}
