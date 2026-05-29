"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="w-full text-sm text-slate-600 hover:text-blue-600 text-left flex items-center gap-2"
    >
      Sign out
    </button>
  );
}
