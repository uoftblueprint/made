function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs font-semibold text-secondary tracking-wide">{label}</span>
      <span className="text-sm text-primary">{value}</span>
    </div>
  )
}

export default DetailRow;