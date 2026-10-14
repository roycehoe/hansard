import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SEARCH_TIPS_CLOSE_DELAY_MS,
  SEARCH_TIPS_TEXT,
} from '@/constants/search/constants'
import { CircleHelp } from 'lucide-react'
import type { FocusEvent, MouseEvent, PointerEvent } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

export function PopoverSearchTips() {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const closeTimeoutRef = useRef<number | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tipsId = useId()

  function cancelClose() {
    window.clearTimeout(closeTimeoutRef.current)
  }

  useEffect(() => cancelClose, [])

  function closeAfterDelay() {
    cancelClose()
    closeTimeoutRef.current = window.setTimeout(
      closeUnlessButtonFocused,
      SEARCH_TIPS_CLOSE_DELAY_MS
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
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          type="button"
          variant="quiet"
          size="icon-xs"
          aria-label="Search tips"
          aria-describedby={tipsId}
          onPointerEnter={openOnMouseEnter}
          onPointerLeave={closeOnMouseLeave}
          onFocus={openOnFocus}
          onBlur={closeOnBlur}
          onClick={openOnClick}
        >
          <CircleHelp aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 text-sm"
        onPointerEnter={openOnMouseEnter}
        onPointerLeave={closeOnMouseLeave}
        onOpenAutoFocus={keepFocusOnButton}
        onCloseAutoFocus={keepFocusOnButton}
      >
        {SEARCH_TIPS_TEXT}
      </PopoverContent>
      <span id={tipsId} className="sr-only">
        {SEARCH_TIPS_TEXT}
      </span>
    </Popover>
  )
}
