import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
  titleAddon?: ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  titleAddon,
}: PageHeaderProps) {
  return (
    <div className="border-separator space-y-4 border-b pb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-serif text-2xl font-semibold break-words lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground max-w-prose text-base">
              {description}
            </p>
          )}
          {titleAddon && <div className="order-first">{titleAddon}</div>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
