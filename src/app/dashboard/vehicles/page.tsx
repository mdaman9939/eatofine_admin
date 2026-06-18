import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";

interface V {
  id: number;
  type: string;
  starting_coverage_area: number;
  maximum_coverage_area: number;
  extra_charges: number;
  status: boolean;
}

export default async function VehiclesPage() {
  const data = await adminFetch<{ vehicles: V[] }>("/admin/vehicles");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/vehicles"
          title="New vehicle"
          fields={[
            { name: "type", label: "Type", required: true, placeholder: "Bike / Scooter / Car" },
            { name: "starting_coverage_area", label: "Starting coverage (km)", type: "number" },
            { name: "maximum_coverage_area", label: "Max coverage (km)", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Vehicles"
        subtitle={`${data.vehicles.length} types`}
        rows={data.vehicles}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Type", cell: (r) => r.type },
          { header: "Coverage", cell: (r) => `${r.starting_coverage_area} – ${r.maximum_coverage_area} km` },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <EditRecordButton basePath="/vehicles" id={r.id} title="Edit vehicle" values={r as unknown as Record<string, unknown>} fields={[
                  { name: "type", label: "Type" },
                  { name: "starting_coverage_area", label: "Starting coverage (km)", type: "number" },
                  { name: "maximum_coverage_area", label: "Max coverage (km)", type: "number" },
                  { name: "extra_charges", label: "Extra charges ₹", type: "number" },
                ]} />
                <ToggleStatusButton basePath="/vehicles" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/vehicles" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
