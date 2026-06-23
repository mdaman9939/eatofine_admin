import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";

interface F {
  id: number;
  question: string;
  answer: string;
  page_type: string | null;
  user_type: string | null;
  status: boolean;
}

export default async function FAQsPage() {
  const data = await adminFetch<{ faqs: F[] }>("/admin/faqs");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/faqs"
          title="New FAQ"
          fields={[
            { name: "question", label: "Question", required: true },
            { name: "answer", label: "Answer", type: "textarea", required: true },
            {
              name: "user_type",
              label: "User type",
              type: "select",
              options: [
                { value: "customer", label: "customer" },
                { value: "vendor", label: "vendor" },
                { value: "deliveryman", label: "deliveryman" },
              ],
            },
            { name: "page_type", label: "Page", placeholder: "home / app / website" },
          ]}
        />
      </div>
      <TablePage
        title="FAQs"
        subtitle={`${data.faqs.length} questions`}
        description="Manage the help questions and answers shown in the apps for customers, restaurants and delivery men — add, edit, show or hide each one."
        rows={data.faqs}
        rowKey={(r) => r.id}
        columns={[
          { header: "Question", cell: (r) => <span className="font-medium">{r.question}</span> },
          { header: "Answer", cell: (r) => <span className="text-zinc-600 dark:text-zinc-300">{r.answer.slice(0, 80)}</span> },
          { header: "User", cell: (r) => r.user_type ?? "—" },
          { header: "Page", cell: (r) => r.page_type ?? "—" },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <EditRecordButton basePath="/faqs" id={r.id} title="Edit FAQ" values={r as unknown as Record<string, unknown>} fields={[
                  { name: "question", label: "Question" },
                  { name: "answer", label: "Answer" },
                ]} />
                <ToggleStatusButton basePath="/faqs" id={r.id} currentStatus={r.status} mode="base-path" />
                <DeleteButton basePath="/faqs" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
