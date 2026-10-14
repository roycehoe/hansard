import type { SpeechData } from '@/api/reports/getReport'
import { ActionBarSpeechCopy } from '@/components/reports/ActionBarSpeechCopy'
import { TextTranscript } from '@/components/reports/TextTranscript'
import { buildSpeechCitation } from '@/lib/citation'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

interface RowSpeechProps {
  speech: SpeechData
  isContinuation: boolean
  reportSlug: string
  sittingDate: string
  volumeNumber: number
  parliamentNumber: number
  highlightPattern?: RegExp
}

export function RowSpeech({
  speech,
  isContinuation,
  reportSlug,
  sittingDate,
  volumeNumber,
  parliamentNumber,
  highlightPattern,
}: RowSpeechProps) {
  const hasSpeakerLabel = speech.speaker_label !== ''

  const citation = hasSpeakerLabel
    ? buildSpeechCitation(
        sittingDate,
        volumeNumber,
        parliamentNumber,
        speech.speaker_label
      )
    : undefined

  function renderSpeakerLabel() {
    if (!hasSpeakerLabel) return undefined
    if (isContinuation) {
      return (
        <span className="sr-only">{speech.speaker_label}, continued: </span>
      )
    }
    if (speech.person_id === null) {
      return (
        <>
          <span className="font-semibold">{speech.speaker_label}</span>
          {': '}
        </>
      )
    }
    return (
      <>
        <Link
          to="/people/$personSlug"
          params={{
            personSlug: `${speech.person_id}-${speech.person_slug}`,
          }}
          className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {speech.speaker_label}
        </Link>
        {': '}
      </>
    )
  }

  return (
    <article
      id={`s${speech.ordinal}`}
      tabIndex={-1}
      className={cn(
        'group focus-visible:ring-ring focus-visible:ring-offset-background flex scroll-mt-24 flex-col rounded-sm outline-hidden first-of-type:mt-0 focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-row sm:gap-2',
        isContinuation ? 'mt-3' : 'mt-6'
      )}
    >
      <div className="max-w-[70ch] min-w-0 sm:flex-1">
        <TextTranscript
          transcript={speech.transcript}
          label={renderSpeakerLabel()}
          isProcedural={!hasSpeakerLabel}
          highlightPattern={highlightPattern}
        />
      </div>
      <ActionBarSpeechCopy
        reportSlug={reportSlug}
        ordinal={speech.ordinal}
        citation={citation}
      />
    </article>
  )
}
