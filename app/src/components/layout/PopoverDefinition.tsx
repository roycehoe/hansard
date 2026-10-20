import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { METHODS_TERMS_SECTION_ID } from '@/constants/coverage/constants'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface PopoverDefinitionProps {
  children: ReactNode
  definition: string
  termsLinkLabel?: string
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export const DEFINED_TERM_CLASS_NAME =
  'decoration-muted-foreground underline decoration-dotted underline-offset-4'

export function PopoverDefinition({
  children,
  definition,
  termsLinkLabel,
}: PopoverDefinitionProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus-visible:ring-ring focus-visible:ring-offset-background inline-flex cursor-pointer rounded-sm text-left outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {children}
          <span className="sr-only">, what this means</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-2 text-sm">
        <p>{definition}</p>
        {termsLinkLabel && (
          <Link
            to="/coverage/methods"
            hash={METHODS_TERMS_SECTION_ID}
            className={LINK_CLASS_NAME}
          >
            {termsLinkLabel}
          </Link>
        )}
      </PopoverContent>
    </Popover>
  )
}
