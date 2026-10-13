import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface NoticeEmptyProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function NoticeEmpty({
  icon: Icon,
  title,
  description,
  action,
}: NoticeEmptyProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-12 py-24">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <Icon size={40} aria-hidden="true" className="text-muted-foreground" />
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground max-w-[420px] text-sm">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
