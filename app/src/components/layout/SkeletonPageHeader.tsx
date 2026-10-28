import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

interface SkeletonPageHeaderProps {
  hasDescription: boolean
  aboveTitle?: ReactNode
  belowDescription?: ReactNode
  actions?: ReactNode
}

export function SkeletonPageHeader({
  hasDescription,
  aboveTitle,
  belowDescription,
  actions,
}: SkeletonPageHeaderProps) {
  return (
    <div className="border-separator space-y-4 border-b pb-6">
      <Skeleton className="h-4 w-48" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {aboveTitle}
          <Skeleton className="h-8 w-full max-w-md lg:h-9" />
          {hasDescription && <Skeleton className="h-5 w-full max-w-sm" />}
          {belowDescription}
        </div>
        {actions}
      </div>
    </div>
  )
}
