import type { SpeechMatchData } from '@/api/search/getSearchSpeeches'
import { SnippetHighlighted } from '@/components/search/SnippetHighlighted'
import { Button } from '@/components/ui/button'
import { VISIBLE_SPEECH_MATCHES_PER_REPORT } from '@/constants/search/constants'
import { Link } from '@tanstack/react-router'
import { useId, useState } from 'react'

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
          <li key={speech.ordinal}>
            <Link
              to="/reports/$reportSlug"
              params={{ reportSlug: speech.report_slug }}
              search={{ hl: highlightWords }}
              hash={`s${speech.ordinal}`}
              className="group focus-visible:ring-ring focus-visible:ring-offset-background block space-y-1 rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {speech.speaker_label !== '' && (
                <p className="text-primary group-hover:text-primary-hover font-semibold group-hover:underline">
                  {speech.speaker_label}
                </p>
              )}
              <SnippetHighlighted snippet={speech.snippet} />
            </Link>
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
