import type { SpeechData } from '@/api/reports/getReport'
import { DIVISION_COUNTS_DISAGREE_NOTE_TEXT } from '@/constants/reports/constants'
import { parseTranscriptInline } from '@/lib/transcript'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

interface TextDivisionNoteProps {
  speech: SpeechData | undefined
  hasColumnMarkers: boolean
}

export function TextDivisionNote({
  speech,
  hasColumnMarkers,
}: TextDivisionNoteProps) {
  if (speech === undefined) return null

  const quote = parseTranscriptInline(speech.transcript)
    .map((segment) => segment.text)
    .join('')

  return (
    <div className="mt-2 flex flex-col sm:flex-row sm:gap-2">
      {hasColumnMarkers && (
        <div className="hidden in-data-[columns=show]:block sm:w-16 sm:shrink-0" />
      )}
      <div className="max-w-[70ch] min-w-0 in-data-[width=wide]:max-w-none sm:flex-1">
        <p className="text-muted-foreground pl-12 text-sm">
          {`${DIVISION_COUNTS_DISAGREE_NOTE_TEXT} After the list, ${speech.speaker_label} says, "`}
          <a href={`#s${speech.ordinal}`} className={LINK_CLASS_NAME}>
            {quote}
          </a>
          {'"'}
        </p>
      </div>
    </div>
  )
}
