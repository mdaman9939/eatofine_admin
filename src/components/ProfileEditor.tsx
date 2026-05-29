"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Admin {
  id: number;
  f_name: string | null;
  l_name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role_id: number | null;
  zone_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export function ProfileEditor({ initial }: { initial: Admin }) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "password">("info");

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 px-6 pt-4">
        <div className="flex gap-6">
          <TabButton active={tab === "info"} onClick={() => setTab("info")}>Profile information</TabButton>
          <TabButton active={tab === "password"} onClick={() => setTab("password")}>Change password</TabButton>
        </div>
      </div>
      <div className="p-6">
        {tab === "info" ? <InfoTab initial={initial} onSaved={() => router.refresh()} /> : <PasswordTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 transition-colors ${active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );
}

function InfoTab({ initial, onSaved }: { initial: Admin; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fName, setFName] = useState(initial.f_name ?? "");
  const [lName, setLName] = useState(initial.l_name ?? "");
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ f_name: fName, l_name: lName, email, phone }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setSaved(true);
      onSaved();
    });
  }

  return (
    <form onSubmit={save} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First name">
          <input value={fName} onChange={(e) => setFName(e.target.value)} className={inp} />
        </Field>
        <Field label="Last name">
          <input value={lName} onChange={(e) => setLName(e.target.value)} className={inp} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inp} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} />
        </Field>
      </div>

      <div className="text-xs text-slate-500 pt-2">
        Account created {initial.created_at ? new Date(initial.created_at).toLocaleString("en-IN") : "—"}
        {" · "}Role ID {initial.role_id ?? "—"}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Saved.</p>}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 disabled:opacity-50">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function PasswordTab() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    if (next.length < 6) { setError("New password must be at least 6 characters"); return; }
    if (next !== confirm) { setError("New password and confirmation don't match"); return; }
    startTransition(async () => {
      const res = await fetch("/api/admin/me/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setSaved(true);
      setCurrent(""); setNext(""); setConfirm("");
    });
  }

  return (
    <form onSubmit={save} className="space-y-4 max-w-md">
      <Field label="Current password">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inp} autoComplete="current-password" required />
      </Field>
      <Field label="New password">
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inp} autoComplete="new-password" required minLength={6} />
      </Field>
      <Field label="Confirm new password">
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inp} autoComplete="new-password" required minLength={6} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Password updated.</p>}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 disabled:opacity-50">
          {pending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

const inp = "block w-full mt-1 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-600 font-semibold">{label}</span>
      {children}
    </label>
  );
}
