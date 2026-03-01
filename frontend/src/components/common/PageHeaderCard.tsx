import * as React from "react"
import Card from "../common/Card"

type EntityHeaderCardProps = {
  title: string
  subtitle?: string
  iconName?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeaderCard({
  title,
  subtitle,
  iconName,
  actions,
  children,
}: EntityHeaderCardProps) {
  return (
    <Card
      radius="md"
      border="on"
      bg="surface"
      padding="lg"
      shadow="sm"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {iconName && (
              <img
                src={`/icons/${iconName}.svg`}
                alt=""
                aria-hidden="true"
                className="h-5 w-5"
              />
            )}
            <h2 className="text-xl font-semibold text-primary">
              {title}
            </h2>
          </div>

          {subtitle && (
            <p className="mt-1 text-sm text-muted">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Stats Section */}
    {children && (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {children}
    </div>
    )}

    </Card>
  )
}
export default PageHeaderCard