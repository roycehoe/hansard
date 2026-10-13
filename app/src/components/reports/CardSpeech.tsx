import type { SpeechData } from '@/api/reports/getReport'
import { ButtonCopyCitation } from '@/components/reports/ButtonCopyCitation'
import { ButtonCopySpeechLink } from '@/components/reports/ButtonCopySpeechLink'
import { TextTranscript } from '@/components/reports/TextTranscript'
import { buildReportCitation, buildSpeechCitation } from '@/lib/citation'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

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
  const speakerId = hasSpeakerLabel ? `s${speech.ordinal}-speaker` : undefined
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
        <p id={speakerId}>
          {speech.person_id !== null ? (
            <Link
              to="/people/$personSlug"
              params={{
                personSlug: `${speech.person_id}-${speech.person_slug}`,
              }}
              className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {speech.speaker_label}
            </Link>
          ) : (
            <span className="font-semibold">{speech.speaker_label}</span>
          )}
        </p>
      )}
      <div className={cn(!hasSpeakerLabel && 'text-muted-foreground italic')}>
        <TextTranscript transcript={speech.transcript} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonCopySpeechLink
          reportSlug={reportSlug}
          ordinal={speech.ordinal}
          describedById={speakerId}
        />
        <ButtonCopyCitation citation={citation} describedById={speakerId} />
      </div>
    </article>
  )
}
