import { UNDERLINED_LINK_CLASS_NAME } from '@/constants/constants'
import type { ReactNode } from 'react'

interface LinkExternalProps {
  href: string
  children: ReactNode
}

export function LinkExternal({ href, children }: LinkExternalProps) {
  return (
    <a
      href={href}
      className={UNDERLINED_LINK_CLASS_NAME}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
