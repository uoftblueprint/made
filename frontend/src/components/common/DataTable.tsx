import * as React from "react"

export type ColumnDef<T> = {
  key: string
  header: React.ReactNode
  width: string
  headerClassName?: string
  cellClassName?: string
  cell: (row: T) => React.ReactNode
}

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyState?: React.ReactNode
}

function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
}: DataTableProps<T>) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto ">
    <table className="table-fixed w-full">
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>

        <thead>
          <tr className="bg-surface">
            {columns.map((c) => (
              <th
                key={c.key}
                className={[
                  "px-5 py-3 text-left text-xs font-semibold text-primary",
                  "border-b border-slate-200",
                  c.headerClassName ?? "",
                ].join(" ")}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-sm text-primary"
              >
                {emptyState ?? "No results."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={
                  "border-b border-border last:border-b-0"}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={[
                      "px-5 py-4 align-middle text-sm text-primary",
                      c.cellClassName ?? "",
                    ].join(" ")}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable;