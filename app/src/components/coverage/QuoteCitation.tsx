import type { ReactNode } from 'react'

interface QuoteCitationProps {
  children: ReactNode
}

export function QuoteCitation({ children }: QuoteCitationProps) {
  return (
    <blockquote className="bg-muted text-foreground border-separator rounded-md border px-4 py-3 text-sm break-words">
      {children}
    </blockquote>
  )
}
