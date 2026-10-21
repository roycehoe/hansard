import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  INFERRED_CREDIT_CAVEAT_TEXT,
  INFERRED_CREDIT_CLOSE_DELAY_MS,
  INFERRED_CREDIT_METHOD_TEXT,
} from '@/constants/reports/constants'
import type { FocusEvent, MouseEvent, PointerEvent } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

const TRIGGER_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background cursor-pointer rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

interface PopoverInferredCreditProps {
  speakerLabel: string
}

function buildInferredCreditSentences(speakerLabel: string): string[] {
  return [
    `The record prints only "${speakerLabel}" here, not a name.`,
    INFERRED_CREDIT_METHOD_TEXT,
    INFERRED_CREDIT_CAVEAT_TEXT,
  ]
}

export function PopoverInferredCredit({
  speakerLabel,
}: PopoverInferredCreditProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const closeTimeoutRef = useRef<number | undefined>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const creditId = useId()
  const sentences = buildInferredCreditSentences(speakerLabel)

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
