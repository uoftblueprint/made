import DetailRow from "./DetailRow"
type ItemDetailsProps = {
  item: {
    madeId: string
    platform: string
    location: string
  }
  onUpdateLocation?: () => void
}

export function ItemDetailsCard({ item }: ItemDetailsProps) {
  return (
    <div className="w-full rounded-xl border border-border bg-background overflow-hidden">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-primary">Item Details</h2>
        </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        <DetailRow label="MADE ID" value={item.madeId} />
        <DetailRow label="Platform" value={item.platform} />
        <DetailRow label="Location / Box" value={item.location} />
      </div>
    </div>
  )
}