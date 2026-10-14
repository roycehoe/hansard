import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SEARCH_TIPS_TEXT } from '@/constants/search/constants'
import { CircleHelp } from 'lucide-react'
import type { FocusEvent, MouseEvent, PointerEvent } from 'react'
import { useState } from 'react'

export function PopoverSearchTips() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  function openOnMouseEnter(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse') return
    setIsOpen(true)
  }

  function closeOnMouseLeave(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse') return
    if (document.activeElement === event.currentTarget) return
    setIsOpen(false)
  }

  function openOnFocus() {
    setIsOpen(true)
  }

  function closeOnBlur(event: FocusEvent<HTMLButtonElement>) {
    if (event.currentTarget.matches(':hover')) return
    setIsOpen(false)
  }

  function openOnClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsOpen(true)
  }

  function keepFocusOnButton(event: Event) {
    event.preventDefault()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="quiet"
          size="icon-xs"
          aria-label="Search tips"
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
        onOpenAutoFocus={keepFocusOnButton}
        onCloseAutoFocus={keepFocusOnButton}
      >
        {SEARCH_TIPS_TEXT}
      </PopoverContent>
    </Popover>
  )
}
