import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MouseEvent, ReactNode } from 'react'
import { useState } from 'react'

const TRIGGER_CLASS_NAME =
  'focus-visible:outline-ring inline-flex cursor-help rounded-sm text-left outline-hidden focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid'

interface TooltipDefinitionProps {
  children: ReactNode
  definition: string
}

export function TooltipDefinition({
  children,
  definition,
}: TooltipDefinitionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  function openOnClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsOpen(true)
  }

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={TRIGGER_CLASS_NAME}
          onClick={openOnClick}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{definition}</TooltipContent>
    </Tooltip>
  )
}
