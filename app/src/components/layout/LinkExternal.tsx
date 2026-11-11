import type { ReactNode } from 'react'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

interface LinkExternalProps {
  href: string
  children: ReactNode
}

export function LinkExternal({ href, children }: LinkExternalProps) {
  return (
    <a href={href} className={LINK_CLASS_NAME} target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
