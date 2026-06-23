import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";

interface S {
  id: number;
  name: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  status: boolean;
}

function fmtTime(t: string | null) {
  if (!t) return "—";
  try {
    return new Date(t).toISOString().substring(11, 16);
  } catch {
    return t;
  }
}

export default async function ShiftsPage() {
  const data = await adminFetch<{ shifts: S[] }>("/admin/shifts");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/shifts"
          title="New shift"
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Morning" },
            { name: "start_time", label: "Start (HH:MM:SS)", placeholder: "09:00:00" },
            { name: "end_time", label: "End (HH:MM:SS)", placeholder: "13:00:00" },
            { name: "is_full_day", label: "Full day", type: "checkbox" },
          ]}
        />
      </div>
      <TablePage
        title="Shifts"
        subtitle={`${data.shifts.length} shifts`}
        description="Set up the work shifts (time windows like Morning or Evening) that staff and delivery men are assigned to — add, edit, enable/disable or delete them."
        rows={data.shifts}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name },
          { header: "Window", cell: (r) => r.is_full_day ? "Full day" : `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}` },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <EditRecordButton basePath="/shifts" id={r.id} title="Edit shift" values={r as unknown as Record<string, unknown>} fields={[
                  { name: "name", label: "Name" },
                  { name: "start_time", label: "Start (HH:MM:SS)" },
                  { name: "end_time", label: "End (HH:MM:SS)" },
                  { name: "is_full_day", label: "Full day", type: "checkbox" },
                ]} />
                <ToggleStatusButton basePath="/shifts" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/shifts" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
