import type { GetReportResponse } from '@/api/reports/getReport'
import { CardSpeech } from '@/components/reports/CardSpeech'
import { useEffect } from 'react'

interface ListSpeechesProps {
  report: GetReportResponse
}

function scrollToSpeechAnchor() {
  const anchorId = window.location.hash.slice(1)
  if (anchorId === '') return
  const speechElement = document.getElementById(anchorId)
  if (!speechElement) return
  speechElement.scrollIntoView()
  speechElement.focus()
}

export function ListSpeeches({ report }: ListSpeechesProps) {
  useEffect(scrollToSpeechAnchor, [])

  return (
    <section aria-labelledby="speeches-heading">
      <h2 id="speeches-heading" className="sr-only">
        Speeches
      </h2>
      {report.speeches.map((speech) => (
        <CardSpeech
          key={speech.ordinal}
          speech={speech}
          reportSlug={report.report_slug}
          sittingDate={report.sitting_date}
          volumeNumber={report.volume_number}
          parliamentNumber={report.parliament_number}
        />
      ))}
    </section>
  )
}
