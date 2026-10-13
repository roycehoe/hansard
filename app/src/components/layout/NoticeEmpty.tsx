import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex flex-col items-center gap-3">
        <Icon size={40} aria-hidden="true" className="text-muted-foreground" />
        <h2 className="text-foreground font-serif text-xl font-semibold">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-[420px] text-sm">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
