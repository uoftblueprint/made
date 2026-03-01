type Stat = { label: string; value: number }

function formatInt(n: number) {
  return n.toLocaleString("en-CA")
}

export function LabelledText({ stats }: { stats: Stat[] }) {
  return (
    <div className="w-full py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className="font-semibold text-primary">{s.label}:</span>
            <span className="text-slate-700 tabular-nums">{formatInt(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LabelledText