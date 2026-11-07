import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CONTACT_EMAIL } from '@/constants/constants'
import type { SpeechActionContext } from '@/lib/speechActions'
import { buildSpeechActions } from '@/lib/speechActions'
import { Flag, Link2, Quote } from 'lucide-react'

export function ActionBarSpeechCopy(props: SpeechActionContext) {
  const { ordinal, citation } = props
  const { copySpeechLink, copySpeechCitation, errorEmailHref } =
    buildSpeechActions(props)

  return (
    <div className="flex shrink-0 items-start opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 any-pointer-coarse:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="quiet"
            size="icon-sm"
            onClick={copySpeechLink}
            aria-label={`Copy link to paragraph ${ordinal}`}
          >
            <Link2 aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy link</TooltipContent>
      </Tooltip>
      {citation !== undefined && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="quiet"
              size="icon-sm"
              onClick={copySpeechCitation}
              aria-label={`Cite paragraph ${ordinal}`}
            >
              <Quote aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cite</TooltipContent>
        </Tooltip>
      )}
      {CONTACT_EMAIL && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="quiet" size="icon-sm">
              <a
                href={errorEmailHref}
                aria-label={`Report an error in paragraph ${ordinal}`}
              >
                <Flag aria-hidden="true" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Report an error</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
