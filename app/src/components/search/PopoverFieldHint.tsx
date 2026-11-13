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
  KeyboardEvent,
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
  const contentRef = useRef<HTMLDivElement>(null)
  const isSkippingReopenRef = useRef<boolean>(false)
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
    if (contentRef.current?.contains(document.activeElement)) return
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
    if (isSkippingReopenRef.current) {
      isSkippingReopenRef.current = false
      return
    }
    cancelClose()
    setIsOpen(true)
  }

  function closeOnBlur(event: FocusEvent<HTMLButtonElement>) {
    if (event.currentTarget.matches(':hover')) return
    if (contentRef.current?.contains(event.relatedTarget)) return
    setIsOpen(false)
  }

  function getHintFocusTargets(): HTMLElement[] {
    return Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>('a[href], summary') ??
        []
    )
  }

  function focusButtonWithoutReopening() {
    isSkippingReopenRef.current = true
    buttonRef.current?.focus()
  }

  function moveFocusIntoHint(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Tab' || event.shiftKey) return
    const [firstFocusTarget] = getHintFocusTargets()
    if (firstFocusTarget === undefined) return
    event.preventDefault()
    firstFocusTarget.focus()
  }

  // The hint renders at the end of the page, so Tab from its last link or fold
  // would leave the form. Focus goes back to the button first, and the
  // browser's own Tab then carries on from there to the next field.
  function moveFocusOutOfHint(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return
    const hintFocusTargets = getHintFocusTargets()
    if (event.shiftKey && document.activeElement === hintFocusTargets[0]) {
      event.preventDefault()
      buttonRef.current?.focus()
      return
    }
    const lastFocusTarget = hintFocusTargets[hintFocusTargets.length - 1]
    if (!event.shiftKey && document.activeElement === lastFocusTarget) {
      focusButtonWithoutReopening()
    }
  }

  function returnFocusToButtonOnEscape() {
    if (!contentRef.current?.contains(document.activeElement)) return
    focusButtonWithoutReopening()
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
          onKeyDown={moveFocusIntoHint}
        >
          <Icon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
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
        onKeyDown={moveFocusOutOfHint}
        onEscapeKeyDown={returnFocusToButtonOnEscape}
      >
        {hint}
      </PopoverContent>
      <div id={hintId} hidden>
        {hint}
      </div>
    </Popover>
  )
}
