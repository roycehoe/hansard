import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  breadcrumb?: ReactNode
  aboveTitle?: ReactNode
  actions?: ReactNode
  titleAction?: ReactNode
  badge?: ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  aboveTitle,
  actions,
  titleAction,
  badge,
}: PageHeaderProps) {
  return (
    <div className="border-separator space-y-4 border-b pb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          {aboveTitle && <div>{aboveTitle}</div>}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1
              tabIndex={-1}
              className="font-serif text-2xl font-semibold break-words outline-hidden lg:text-3xl"
            >
              {title}
            </h1>
            {titleAction}
            {badge}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-prose text-base">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
