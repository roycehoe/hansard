import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: PageHeaderProps) {
  return (
    <div className="border-separator space-y-4 border-b pb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-semibold">{title}</h1>
          {description && (
            <p className="text-muted-foreground max-w-prose text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
