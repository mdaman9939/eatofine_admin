import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { RolePermissionForm, parseModules } from "../../../../../components/RolePermissionForm";

interface R { id: number; name: string; modules: string | null; status: boolean }

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminFetch<{ roles: R[] }>("/admin/admin-roles");
  const role = data.roles.find((r) => String(r.id) === id);
  if (!role) notFound();

  return (
    <div className="p-8 space-y-5 max-w-5xl">
      <div>
        <Link href="/dashboard/admin-roles" className="text-sm text-emerald-700 hover:underline">← All roles</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit role — {role.name}</h1>
        <p className="text-sm text-slate-500">Tick the modules this role can access.</p>
      </div>
      <RolePermissionForm
        mode="edit"
        roleId={role.id}
        initialName={role.name}
        initialModules={parseModules(role.modules)}
      />
    </div>
  );
}
