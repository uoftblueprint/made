export function ActivityRow({
  text,
  time,
}: {
  text: string
  time: string
}) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
        <span>{text}</span>
      </div>

      <span className="text-xs text-slate-400">
        {time}
      </span>
    </div>
  )
}
