import type { ReactNode } from 'react'

const LINK_CLASS_NAME =
  'text-link focus-visible:outline-ring rounded-sm outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-2 underline underline-offset-4'

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
