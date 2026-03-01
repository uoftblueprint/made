export function BulletRow({
  text,
  heading = ''
}: {
  text: string,
  heading?: string
}) {
  const message = heading ? `: ${text}` : text
  return (
    <div className="flex items-start gap-2 text-sm text-muted">
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted_2" />
      <span>
        <span className="text-primary font-semibold">{heading}</span>{message}
      </span>
    </div>
  )
}
