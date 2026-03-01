import Card from "./Card"
type FeatureCardProps = {
  title: string
  icon?: string
  variant?: "default" | "activity" | "compact"
  showHeaderDivider?: boolean
  children: React.ReactNode
  className?: string
  border?: "on" | "off"
  bg?: "card" | "surface";
  shadow?: "none" | "sm" | "md";

}

export function FeatureCard({
  title,
  icon,
  variant = "default",
  showHeaderDivider = false,
  children,
  className = "",
  border = "on",
  bg = "card",
  shadow= "none",

}: FeatureCardProps) {
  const padding = variant === "compact" ? "p-4" : "p-6"

  return (
    <Card className={`${padding} ${className}`} shadow={shadow} border={border} bg={bg} >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {icon && (
            <img
              src={`/icons/${icon}.svg`}
              alt=""
              aria-hidden="true"
              className="h-5 w-5"
            />
          )}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>

        {showHeaderDivider && (
          <div className="my-4 h-px w-full bg-border" />
        )}
        {!showHeaderDivider && (<div className="h-4 w-full" />)}

        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </Card>
  )
}

export default FeatureCard