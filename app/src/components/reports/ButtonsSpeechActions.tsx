import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { copyTextWithToast } from '@/lib/utils'
import { Link2, Quote } from 'lucide-react'

interface ButtonsSpeechActionsProps {
  reportSlug: string
  ordinal: number
  citation?: string
}

export function ButtonsSpeechActions({
  reportSlug,
  ordinal,
  citation,
}: ButtonsSpeechActionsProps) {
  function copySpeechLink() {
    return copyTextWithToast(
      `${window.location.origin}/reports/${encodeURIComponent(reportSlug)}#s${ordinal}`,
      'Link copied',
      "Couldn't copy the link"
    )
  }

  function copySpeechCitation() {
    return copyTextWithToast(
      citation ?? '',
      'Citation copied',
      "Couldn't copy the citation"
    )
  }

  return (
    <div className="flex shrink-0 items-start opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="quiet"
            size="icon-sm"
            onClick={copySpeechLink}
            aria-label={`Copy link to speech ${ordinal}`}
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
              aria-label={`Copy citation for speech ${ordinal}`}
            >
              <Quote aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy citation</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
