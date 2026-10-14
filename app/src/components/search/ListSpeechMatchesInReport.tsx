import type { SpeechMatchData } from '@/api/search/getSearchSpeeches'
import { SnippetHighlighted } from '@/components/search/SnippetHighlighted'
import { Button } from '@/components/ui/button'
import { VISIBLE_SPEECH_MATCHES_PER_REPORT } from '@/constants/search/constants'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { useId, useState } from 'react'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

interface ListSpeechMatchesInReportProps {
  speeches: SpeechMatchData[]
  highlightWords: string | undefined
}

export function ListSpeechMatchesInReport({
  speeches,
  highlightWords,
}: ListSpeechMatchesInReportProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const listId = useId()
  const hiddenCount = speeches.length - VISIBLE_SPEECH_MATCHES_PER_REPORT
  const visibleSpeeches = isExpanded
    ? speeches
    : speeches.slice(0, VISIBLE_SPEECH_MATCHES_PER_REPORT)

  function toggleExpanded() {
    setIsExpanded((previous) => !previous)
  }

  return (
    <>
      <ul
        id={listId}
        className="border-separator ml-1 space-y-4 border-l-2 pl-4"
      >
        {visibleSpeeches.map((speech) => (
          <li key={speech.ordinal} className="space-y-1">
            {speech.speaker_label !== '' && (
              <p>
                {speech.person_id !== null ? (
                  <Link
                    to="/people/$personSlug"
                    params={{
                      personSlug: `${speech.person_id}-${speech.person_slug}`,
                    }}
                    className={cn(LINK_CLASS_NAME, 'font-semibold')}
                  >
                    {speech.speaker_label}
                  </Link>
                ) : (
                  <span className="font-semibold">{speech.speaker_label}</span>
                )}
              </p>
            )}
            <SnippetHighlighted snippet={speech.snippet} />
            <p className="text-sm">
              <Link
                to="/reports/$reportSlug"
                params={{ reportSlug: speech.report_slug }}
                search={{ hl: highlightWords }}
                hash={`s${speech.ordinal}`}
                className={LINK_CLASS_NAME}
              >
                Go to speech
                {speech.speaker_label !== '' && (
                  <span className="sr-only"> by {speech.speaker_label}</span>
                )}
              </Link>
            </p>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <div className="ml-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            aria-expanded={isExpanded}
            aria-controls={listId}
            onClick={toggleExpanded}
          >
            {isExpanded ? 'Show fewer' : `${hiddenCount} more in this report`}
          </Button>
        </div>
      )}
    </>
  )
}
