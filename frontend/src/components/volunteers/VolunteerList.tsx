import DataTable from "../common/DataTable"
import type { ColumnDef } from "../common/DataTable"
import Card from "../common/Card"
import Button from "../common/Button"

export type VolunteerRow = {
  id: string
  name: string
  email: string
  role: "Editor" | "Viewer"
  grantedDate: string
  expiresDate: string
  daysRemaining: number
  status: "Active" | "Expired"
}

function Truncate({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-ellipsis whitespace-nowrap">
      {children}
    </div>
  )
}

function VolunteersTableUI({
  title = "All Volunteers",
  rows,
  onEdit,
  onExtend,
  onRenew,
  onDelete,
}: {
  title?: string
  rows: VolunteerRow[]
  onEdit: (r: VolunteerRow) => void
  onExtend: (r: VolunteerRow) => void
  onRenew: (r: VolunteerRow) => void
  onDelete: (r: VolunteerRow) => void
}) {
  const columns: ColumnDef<VolunteerRow>[] = [
    {
      key: "name",
      header: "Name",
      width: "180px",
      cell: (r) => (
        <Truncate>
          <span className="font-medium text-primary">{r.name}</span>
        </Truncate>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "260px",
      cell: (r) => (
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-primary font-normal">
            ✉
          </span>
          <Truncate>
            <span className="text-primary">{r.email}</span>
          </Truncate>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      width: "120px",
      cellClassName: "whitespace-nowrap",
      cell: (r) => (
        <span className="inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-primary">
          {r.role}
        </span>
      ),
    },
    {
      key: "granted",
      header: "Granted Date",
      width: "140px",
      cellClassName: "whitespace-nowrap",
      cell: (r) => <span className="text-primary font-normal">{r.grantedDate}</span>,
    },
    {
      key: "expires",
      header: "Expires",
      width: "170px",
      cellClassName: "whitespace-nowrap",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="text-primary">{r.expiresDate}</span>
          <span
            className={[
              "text-xs",
              r.daysRemaining < 0
                ? "text-rose-600"
                : r.daysRemaining < 7
                ? "text-warning"
                : "text-muted",
            ].join(" ")}
          > 
            {r.daysRemaining < 0
              ? `${Math.abs(r.daysRemaining)} days ago`
              : `${r.daysRemaining} days remaining`}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      cellClassName: "whitespace-nowrap",
      cell: (r) => (
        <span className="inline-flex items-center gap-2">
          {r.status === "Active" && <img src={`/icons/accept.svg`} alt="" aria-hidden="true" className="w-4 h-4"/>}
          {r.status === "Expired" && <img src={`/icons/reject.svg`} alt="" aria-hidden="true" className="w-5 h-5"/>}

          <label
            className={[
              "inline-flex rounded-full py-1 text-xs font-medium",
              r.status === "Active"
                ? " text-success"
                : " text-danger",
            ].join(" ")}
          >
            {r.status}
          </label>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "130px",
      cellClassName: "whitespace-nowrap",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            onClick={() => onEdit(r)}
            icon="edit"
            aria-label={`Edit ${r.name}`}
            className="bg-transparent"
          />

          {r.status === "Expired" ? (
            <Button
              onClick={() => onRenew(r)}
              radius="lg"
              size="sm"
              variant="success"
              aria-label={`Renew ${r.name}`}
            >
              Renew
            </Button>
          ) : (
            <Button
              onClick={() => onExtend(r)}
              variant="outline-black"
              size="sm"
              radius="lg"
              aria-label={`Extend ${r.name}`}
            >
              Extend
            </Button>
          )}

          <Button
            onClick={() => onDelete(r)}
            icon="trash"
            className="bg-transparent"
            aria-label={`Delete ${r.name}`}
          />
        </div>
      ),
    },
  ]

  return (
    <Card radius="xl" border="on" bg="card" shadow="sm"  padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-surface">
        <div className="text-sm font-semibold text-primary">{title}</div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        emptyState="No volunteers yet."
      />
    </Card>
  )
}

export default VolunteersTableUI