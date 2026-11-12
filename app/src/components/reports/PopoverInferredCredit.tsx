import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { INFERRED_CREDIT_CLOSE_DELAY_MS } from '@/constants/reports/constants'
import type { FocusEvent, MouseEvent, PointerEvent } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

const TRIGGER_CLASS_NAME =
  'relative after:absolute after:-inset-y-2 after:-right-4 after:-left-1 text-link cursor-pointer outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

interface PopoverInferredCreditProps {
  sentences: string[]
}

export function PopoverInferredCredit({
  sentences,
}: PopoverInferredCreditProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const closeTimeoutRef = useRef<number | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const creditId = useId()

  function cancelClose() {
    window.clearTimeout(closeTimeoutRef.current)
  }

  useEffect(() => cancelClose, [])

  function closeAfterDelay() {
    cancelClose()
    closeTimeoutRef.current = window.setTimeout(
      closeUnlessButtonFocused,
      INFERRED_CREDIT_CLOSE_DELAY_MS
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
      <sup className="ml-1 text-xs">
        <PopoverTrigger asChild>
          <button
            ref={buttonRef}
            type="button"
            aria-describedby={creditId}
            className={TRIGGER_CLASS_NAME}
            onPointerEnter={openOnMouseEnter}
            onPointerLeave={closeOnMouseLeave}
            onFocus={openOnFocus}
            onBlur={closeOnBlur}
            onClick={openOnClick}
          >
            i<span className="sr-only">, inferred credit</span>
          </button>
        </PopoverTrigger>
      </sup>
      <PopoverContent
        align="start"
        className="w-72 space-y-2 text-sm"
        onPointerEnter={openOnMouseEnter}
        onPointerLeave={closeOnMouseLeave}
        onOpenAutoFocus={keepFocusOnButton}
        onCloseAutoFocus={keepFocusOnButton}
      >
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </PopoverContent>
      <span id={creditId} hidden>
        {sentences.join(' ')}
      </span>
    </Popover>
  )
}
