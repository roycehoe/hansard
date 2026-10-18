import type { SpeechData } from '@/api/reports/getReport'
import { ActionBarSpeechCopy } from '@/components/reports/ActionBarSpeechCopy'
import { TextTranscript } from '@/components/reports/TextTranscript'
import { SPEAKER_NOT_RECORDED_LABEL } from '@/constants/reports/constants'
import { SpeechKind, TranscriptStyle } from '@/constants/reports/enums'
import { buildSpeechCitation } from '@/lib/citation'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

interface RowSpeechProps {
  speech: SpeechData
  isContinuation: boolean
  reportSlug: string
  reportTitle: string
  sittingDate: string
  volumeNumber: number
  parliamentNumber: number
  officialRecordUrl: string
  highlightPattern?: RegExp
}

function getTranscriptStyle(speech: SpeechData): TranscriptStyle {
  switch (speech.kind) {
    case SpeechKind.SPEECH:
      return TranscriptStyle.BODY
    case SpeechKind.PROCEDURAL:
    case SpeechKind.CHAMBER_EVENT:
    case SpeechKind.EDITORIAL_NOTE:
      return TranscriptStyle.MUTED
    case SpeechKind.DOCUMENT_TEXT:
      return TranscriptStyle.QUOTED
    case SpeechKind.HEADING:
      return TranscriptStyle.HEADING
    default:
      return speech.speaker_label === ''
        ? TranscriptStyle.MUTED
        : TranscriptStyle.BODY
  }
}

export function RowSpeech({
  speech,
  isContinuation,
  reportSlug,
  reportTitle,
  sittingDate,
  volumeNumber,
  parliamentNumber,
  officialRecordUrl,
  highlightPattern,
}: RowSpeechProps) {
  const hasSpeakerLabel = speech.speaker_label !== ''

  const citation = hasSpeakerLabel
    ? buildSpeechCitation(
        sittingDate,
        volumeNumber,
        parliamentNumber,
        speech.speaker_label,
        speech.person_name
      )
    : undefined

  function renderSpeakerLabel() {
    if (!hasSpeakerLabel && speech.kind === SpeechKind.SPEECH) {
      return (
        <>
          <span className="text-muted-foreground font-semibold">
            {SPEAKER_NOT_RECORDED_LABEL}
          </span>
          {': '}
        </>
      )
    }
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
          transcriptStyle={getTranscriptStyle(speech)}
          highlightPattern={highlightPattern}
        />
      </div>
      <ActionBarSpeechCopy
        reportSlug={reportSlug}
        reportTitle={reportTitle}
        ordinal={speech.ordinal}
        anchor={speech.anchor}
        officialRecordUrl={officialRecordUrl}
        citation={citation}
      />
    </article>
  )
}
