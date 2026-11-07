import { PAGE_TITLE_CLASS_NAME } from '@/constants/constants'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  belowDescription?: ReactNode
  breadcrumb?: ReactNode
  actions?: ReactNode
  titleAction?: ReactNode
  badge?: ReactNode
  hasRule?: boolean
}

export function PageHeader({
  title,
  description,
  belowDescription,
  breadcrumb,
  actions,
  titleAction,
  badge,
  hasRule = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn('space-y-4', hasRule && 'border-separator border-b pb-6')}
    >
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 tabIndex={-1} className={PAGE_TITLE_CLASS_NAME}>
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
          {belowDescription}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}
