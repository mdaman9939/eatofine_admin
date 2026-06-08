import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { ApproveRejectButtons } from "../../../../components/ApproveRejectButtons";
import { ToggleStatusButton } from "../../../../components/ActionButton";

interface DMDetail {
  delivery_man: {
    id: number;
    f_name: string | null;
    l_name: string | null;
    email: string | null;
    phone: string | null;
    image?: string | null;
    type?: string | null;
    zone_id: number | null;
    vehicle_id: number | null;
    shift_id: number | null;
    age?: number | null;
    dob?: string | null;
    identity_type?: string | null;
    identity_number?: string | null;
    identity_image?: string[] | null;
    license_image?: string | null;
    status?: boolean | null;
    application_status?: string | null;
  };
}

const STORAGE_BASE =
  ((process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/v1\/?$/, "") || "http://127.0.0.1:3000") + "/storage/delivery-man/";
const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

export default async function DeliveryManViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminFetch<DMDetail>(`/admin/delivery-men/${id}`);
  const d = data.delivery_man;
  const name = `${d.f_name ?? ""} ${d.l_name ?? ""}`.trim() || `#${d.id}`;
  const pending = (d.application_status ?? "").toLowerCase() !== "approved";

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-4">
          {d.image && d.image !== "def.png" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${STORAGE_BASE}${d.image}`} alt={name} className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 bg-slate-100" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg font-bold">
              {(d.f_name?.[0] ?? "D").toUpperCase()}
            </div>
          )}
          <div>
            <Link href="/dashboard/delivery-men-pending" className="text-sm text-emerald-700 hover:underline">← Joining requests</Link>
            <h1 className="mt-1 text-2xl font-semibold">{name}</h1>
            <p className="text-sm text-slate-500">
              #{d.id} · <span className="capitalize">{d.application_status ?? "—"}</span> · {d.type ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/dashboard/delivery-men/${d.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
          <ToggleStatusButton basePath="/delivery-men" id={d.id} currentStatus={!!d.status} />
          {pending && <ApproveRejectButtons basePath="delivery-men" id={d.id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Contact">
          <KV label="Email" value={d.email} />
          <KV label="Phone" value={d.phone} />
        </Card>
        <Card title="Assignment">
          <KV label="Type" value={d.type} />
          <KV label="Zone" value={d.zone_id != null ? `Zone #${d.zone_id}` : null} />
          <KV label="Vehicle" value={d.vehicle_id != null ? `#${d.vehicle_id}` : null} />
          <KV label="Shift" value={d.shift_id != null ? `#${d.shift_id}` : null} />
        </Card>
        <Card title="Additional data">
          <KV label="Age" value={d.age != null ? String(d.age) : null} />
          <KV label="Date of birth" value={fmt(d.dob)} />
        </Card>
        <Card title="Documentation">
          <KV label="Identity type" value={d.identity_type} />
          <KV label="Identity number" value={d.identity_number} />
        </Card>
      </div>

      {/* Document images */}
      {(d.license_image || (d.identity_image && d.identity_image.length > 0)) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Documents</h2>
          <div className="flex flex-wrap gap-3">
            {d.license_image && (
              <figure className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${STORAGE_BASE}${d.license_image}`} alt="license" className="w-40 h-28 object-cover rounded-lg ring-1 ring-slate-200" />
                <figcaption className="text-xs text-slate-500 mt-1">Driving license</figcaption>
              </figure>
            )}
            {(d.identity_image ?? []).map((img, i) => (
              <figure key={i} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${STORAGE_BASE}${img}`} alt="identity" className="w-40 h-28 object-cover rounded-lg ring-1 ring-slate-200" />
                <figcaption className="text-xs text-slate-500 mt-1">Identity doc {i + 1}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{title}</h2>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 text-right">{value || "—"}</dd>
    </div>
  );
}
