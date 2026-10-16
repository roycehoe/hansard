import type { GetReportResponse, SpeechData } from '@/api/reports/getReport'
import { NoticeHighlighting } from '@/components/reports/NoticeHighlighting'
import { RowSpeech } from '@/components/reports/RowSpeech'
import { SpeechKind } from '@/constants/reports/enums'
import { buildHighlightPattern } from '@/lib/highlight'
import { useEffect } from 'react'

interface ListSpeechesProps {
  report: GetReportResponse
  highlightTerms: string[]
}

function scrollToSpeechAnchor() {
  const anchorId = window.location.hash.slice(1)
  if (anchorId === '') return
  const speechElement = document.getElementById(anchorId)
  if (!speechElement) return
  speechElement.scrollIntoView()
  speechElement.focus()
}

function getPreviousSpeakerLabel(
  speeches: SpeechData[],
  index: number
): string | undefined {
  for (let previousIndex = index - 1; previousIndex >= 0; previousIndex--) {
    const previousSpeech = speeches[previousIndex]
    if (
      previousSpeech.kind !== SpeechKind.CHAMBER_EVENT &&
      previousSpeech.kind !== SpeechKind.EDITORIAL_NOTE
    ) {
      return previousSpeech.speaker_label
    }
  }
  return undefined
}

export function ListSpeeches({ report, highlightTerms }: ListSpeechesProps) {
  useEffect(scrollToSpeechAnchor, [])
  const highlightPattern = buildHighlightPattern(highlightTerms)

  return (
    <section aria-labelledby="speeches-heading">
      <h2 id="speeches-heading" className="sr-only">
        Speeches
      </h2>
      {highlightPattern !== undefined && (
        <NoticeHighlighting
          reportSlug={report.report_slug}
          terms={highlightTerms}
        />
      )}
      {report.speeches.map((speech, index) => (
        <RowSpeech
          key={speech.ordinal}
          speech={speech}
          isContinuation={
            speech.speaker_label !== '' &&
            getPreviousSpeakerLabel(report.speeches, index) ===
              speech.speaker_label
          }
          reportSlug={report.report_slug}
          sittingDate={report.sitting_date}
          volumeNumber={report.volume_number}
          parliamentNumber={report.parliament_number}
          highlightPattern={highlightPattern}
        />
      ))}
    </section>
  )
}
