import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CONTACT_EMAIL } from '@/constants/constants'
import type { SpeechActionContext } from '@/lib/speechActions'
import { buildSpeechActions } from '@/lib/speechActions'
import { EllipsisVertical, Flag, Link2, Quote } from 'lucide-react'
import { useState } from 'react'

const DOTS_WRAPPER_CLASS_NAME =
  'float-right -mr-1.5 ml-1.5 flex h-lh items-center sm:hidden'

export function PopoverSpeechActions(props: SpeechActionContext) {
  const { ordinal, citation } = props
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { copySpeechLink, copySpeechCitation, errorEmailHref } =
    buildSpeechActions(props)
  const actionsLabel = `Actions for paragraph ${ordinal}`
  const [hasOpened, setHasOpened] = useState<boolean>(false)

  function closeMenu() {
    setIsOpen(false)
  }

  function copyLinkAndClose() {
    copySpeechLink()
    closeMenu()
  }

  function copyCitationAndClose() {
    copySpeechCitation()
    closeMenu()
  }

  function openFirstMenu() {
    setHasOpened(true)
    setIsOpen(true)
  }

  const dotsButton = (
    <Button
      type="button"
      variant="quiet-toggle"
      size="icon-line"
      aria-label={actionsLabel}
      onClick={hasOpened ? undefined : openFirstMenu}
    >
      <EllipsisVertical aria-hidden="true" />
    </Button>
  )

  // Most readers never open a paragraph's menu, so the popover is built on the
  // first tap. Until then the dots are a plain button.
  if (!hasOpened) {
    return <span className={DOTS_WRAPPER_CLASS_NAME}>{dotsButton}</span>
  }

  return (
    <span className={DOTS_WRAPPER_CLASS_NAME}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{dotsButton}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          aria-label={actionsLabel}
          className="[&_svg]:text-muted-foreground w-50 p-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="full-row"
            onClick={copyLinkAndClose}
          >
            <Link2 aria-hidden="true" />
            Copy link
          </Button>
          {citation !== undefined && (
            <Button
              type="button"
              variant="ghost"
              size="full-row"
              onClick={copyCitationAndClose}
            >
              <Quote aria-hidden="true" />
              Cite
            </Button>
          )}
          {CONTACT_EMAIL && (
            <Button asChild variant="ghost" size="full-row">
              <a href={errorEmailHref} onClick={closeMenu}>
                <Flag aria-hidden="true" />
                Report an error
              </a>
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </span>
  )
}
