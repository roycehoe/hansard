import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CONTACT_EMAIL } from '@/constants/constants'
import { buildSpeechCite, buildSpeechPermalink } from '@/lib/citation'
import { formatCalendarDate } from '@/lib/format'
import { buildErrorEmailHref, copyTextWithToast } from '@/lib/utils'
import { Flag, Link2, Quote } from 'lucide-react'

interface ActionBarSpeechCopyProps {
  reportSlug: string
  reportTitle: string
  ordinal: number
  anchor: string
  officialRecordUrl: string
  citation?: string
}

export function ActionBarSpeechCopy({
  reportSlug,
  reportTitle,
  ordinal,
  anchor,
  officialRecordUrl,
  citation,
}: ActionBarSpeechCopyProps) {
  const speechPermalink = buildSpeechPermalink(reportSlug, ordinal, anchor)

  function copySpeechLink() {
    return copyTextWithToast(
      speechPermalink,
      'Link copied',
      "Couldn't copy the link"
    )
  }

  function copySpeechCitation() {
    return copyTextWithToast(
      buildSpeechCite(
        citation ?? '',
        reportTitle,
        speechPermalink,
        officialRecordUrl,
        formatCalendarDate(new Date())
      ),
      'Citation copied',
      "Couldn't copy the citation"
    )
  }

  return (
    <div className="flex shrink-0 items-start opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 any-pointer-coarse:opacity-100">
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
              aria-label={`Cite speech ${ordinal}`}
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
                href={buildErrorEmailHref(
                  `Error in ${reportTitle}`,
                  speechPermalink
                )}
                aria-label={`Report an error in speech ${ordinal}`}
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
