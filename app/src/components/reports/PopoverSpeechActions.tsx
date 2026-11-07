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

export function PopoverSpeechActions(props: SpeechActionContext) {
  const { ordinal, citation } = props
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { copySpeechLink, copySpeechCitation, errorEmailHref } =
    buildSpeechActions(props)
  const actionsLabel = `Actions for paragraph ${ordinal}`

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

  return (
    <span className="float-right -mr-1.5 ml-1.5 flex h-lh items-center sm:hidden">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="quiet-toggle"
            size="icon-line"
            aria-label={actionsLabel}
          >
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          aria-label={actionsLabel}
          className="[&_svg]:text-muted-foreground w-50 p-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="row"
            onClick={copyLinkAndClose}
          >
            <Link2 aria-hidden="true" />
            Copy link
          </Button>
          {citation !== undefined && (
            <Button
              type="button"
              variant="ghost"
              size="row"
              onClick={copyCitationAndClose}
            >
              <Quote aria-hidden="true" />
              Cite
            </Button>
          )}
          {CONTACT_EMAIL && (
            <Button asChild variant="ghost" size="row">
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
