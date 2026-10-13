import type { SpeechData } from '@/api/reports/getReport'
import { ButtonCopyCitation } from '@/components/reports/ButtonCopyCitation'
import { ButtonCopySpeechLink } from '@/components/reports/ButtonCopySpeechLink'
import { TextTranscript } from '@/components/reports/TextTranscript'
import { buildReportCitation, buildSpeechCitation } from '@/lib/citation'
import { cn } from '@/lib/utils'

interface CardSpeechProps {
  speech: SpeechData
  reportSlug: string
  sittingDate: string
  volumeNumber: number
  parliamentNumber: number
}

export function CardSpeech({
  speech,
  reportSlug,
  sittingDate,
  volumeNumber,
  parliamentNumber,
}: CardSpeechProps) {
  const hasSpeakerLabel = speech.speaker_label !== ''
  const citation = hasSpeakerLabel
    ? buildSpeechCitation(
        sittingDate,
        volumeNumber,
        parliamentNumber,
        speech.speaker_label
      )
    : buildReportCitation(sittingDate, volumeNumber, parliamentNumber)

  return (
    <article
      id={`s${speech.ordinal}`}
      tabIndex={-1}
      className="border-separator focus-visible:ring-ring focus-visible:ring-offset-background scroll-mt-24 space-y-2 rounded-sm border-b py-4 outline-hidden last:border-b-0 focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {hasSpeakerLabel && (
        <p>
          <span className="font-semibold">{speech.speaker_label}</span>
        </p>
      )}
      <div className={cn(!hasSpeakerLabel && 'text-muted-foreground italic')}>
        <TextTranscript transcript={speech.transcript} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonCopySpeechLink
          reportSlug={reportSlug}
          ordinal={speech.ordinal}
        />
        <ButtonCopyCitation citation={citation} />
      </div>
    </article>
  )
}
