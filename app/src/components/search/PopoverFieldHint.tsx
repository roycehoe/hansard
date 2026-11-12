import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { FIELD_HINT_CLOSE_DELAY_MS } from '@/constants/search/constants'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type {
  FocusEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from 'react'
import { useEffect, useId, useRef, useState } from 'react'

interface PopoverFieldHintProps {
  icon: LucideIcon
  label: string
  hint: ReactNode
  anchorRef?: RefObject<HTMLDivElement | null>
}

export function PopoverFieldHint({
  icon: Icon,
  label,
  hint,
  anchorRef,
}: PopoverFieldHintProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const closeTimeoutRef = useRef<number | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hintId = useId()
  const hasAnchor = anchorRef !== undefined

  function cancelClose() {
    window.clearTimeout(closeTimeoutRef.current)
  }

  useEffect(() => cancelClose, [])

  function closeAfterDelay() {
    cancelClose()
    closeTimeoutRef.current = window.setTimeout(
      closeUnlessButtonFocused,
      FIELD_HINT_CLOSE_DELAY_MS
    )
  }

  function closeUnlessButtonFocused() {
    if (document.activeElement === buttonRef.current) return
    setIsOpen(false)
  }

  function openOnMouseEnter(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return
    cancelClose()
    setIsOpen(true)
  }

  function closeOnMouseLeave(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return
    closeAfterDelay()
  }

  function openOnFocus() {
    cancelClose()
    setIsOpen(true)
  }

  function closeOnBlur(event: FocusEvent<HTMLButtonElement>) {
    if (event.currentTarget.matches(':hover')) return
    setIsOpen(false)
  }

  function openOnClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    cancelClose()
    setIsOpen(true)
  }

  function keepFocusOnButton(event: Event) {
    event.preventDefault()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {hasAnchor && <PopoverAnchor virtualRef={anchorRef} />}
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          type="button"
          variant="quiet"
          size="icon-xs"
          aria-label={label}
          aria-describedby={hintId}
          onPointerEnter={openOnMouseEnter}
          onPointerLeave={closeOnMouseLeave}
          onFocus={openOnFocus}
          onBlur={closeOnBlur}
          onClick={openOnClick}
        >
          <Icon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={hasAnchor ? 'bottom' : 'top'}
        avoidCollisions={!hasAnchor}
        align="start"
        className={cn(
          'max-h-(--radix-popover-content-available-height) overflow-y-auto text-sm',
          hasAnchor ? 'w-(--radix-popover-trigger-width) md:min-w-72' : 'w-72'
        )}
        onPointerEnter={openOnMouseEnter}
        onPointerLeave={closeOnMouseLeave}
        onOpenAutoFocus={keepFocusOnButton}
        onCloseAutoFocus={keepFocusOnButton}
      >
        {hint}
      </PopoverContent>
      <div id={hintId} className="sr-only">
        {hint}
      </div>
    </Popover>
  )
}
