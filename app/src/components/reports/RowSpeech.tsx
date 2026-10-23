import type { SpeechData } from '@/api/reports/getReport'
import { HoverCardPerson } from '@/components/people/HoverCardPerson'
import { ActionBarSpeechCopy } from '@/components/reports/ActionBarSpeechCopy'
import { PopoverInferredCredit } from '@/components/reports/PopoverInferredCredit'
import { TextTranscript } from '@/components/reports/TextTranscript'
import { COLUMN_MARKER_APPEARANCE_CLASS_NAME } from '@/constants/appearance/constants'
import { SPEAKER_NOT_RECORDED_LABEL } from '@/constants/reports/constants'
import { SpeechKind, TranscriptStyle } from '@/constants/reports/enums'
import { buildSpeechCitation } from '@/lib/citation'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

interface RowSpeechProps {
  speech: SpeechData
  isContinuation: boolean
  previousSpeechKind: SpeechKind | null
  reportSlug: string
  reportTitle: string
  sittingDate: string
  volumeNumber: number
  parliamentNumber: number
  officialRecordUrl: string
  hasColumnMarkers: boolean
  highlightPattern?: RegExp
}

function getTranscriptStyle(speech: SpeechData): TranscriptStyle {
  switch (speech.kind) {
    case SpeechKind.SPEECH:
      return TranscriptStyle.BODY
    case SpeechKind.PROCEDURAL:
    case SpeechKind.CHAMBER_EVENT:
      return TranscriptStyle.STAGE_DIRECTION
    case SpeechKind.EDITORIAL_NOTE:
      return TranscriptStyle.FOOTNOTE
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

function isStageDirection(kind: SpeechKind | null): boolean {
  return kind === SpeechKind.PROCEDURAL || kind === SpeechKind.CHAMBER_EVENT
}

function getRowMarginClass(
  speech: SpeechData,
  previousSpeechKind: SpeechKind | null,
  isContinuation: boolean
): string {
  if (isStageDirection(previousSpeechKind)) {
    if (isStageDirection(speech.kind)) return 'mt-1'
    if (speech.kind === SpeechKind.DOCUMENT_TEXT) return 'mt-2'
  }
  return isContinuation ? 'mt-3' : 'mt-6'
}

export function RowSpeech({
  speech,
  isContinuation,
  previousSpeechKind,
  reportSlug,
  reportTitle,
  sittingDate,
  volumeNumber,
  parliamentNumber,
  officialRecordUrl,
  hasColumnMarkers,
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
        <HoverCardPerson
          personId={speech.person_id}
          personSlug={speech.person_slug}
        >
          <Link
            to="/people/$personSlug"
            params={{
              personSlug: `${speech.person_id}-${speech.person_slug}`,
            }}
            className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {speech.speaker_label}
          </Link>
        </HoverCardPerson>
        {speech.is_shared_role_credit && (
          <PopoverInferredCredit speakerLabel={speech.speaker_label} />
        )}
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
        getRowMarginClass(speech, previousSpeechKind, isContinuation)
      )}
    >
      {hasColumnMarkers && (
        <div className="in-data-[columns=hide]:hidden sm:w-16 sm:shrink-0 sm:text-right">
          {typeof speech.column_start === 'number' && (
            <span
              className={cn(
                'text-muted-foreground text-xs leading-7 tabular-nums',
                COLUMN_MARKER_APPEARANCE_CLASS_NAME
              )}
            >
              col. {speech.column_start}
            </span>
          )}
        </div>
      )}
      <div className="max-w-[70ch] min-w-0 in-data-[width=wide]:max-w-none sm:flex-1">
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
