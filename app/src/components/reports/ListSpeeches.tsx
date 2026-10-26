import type {
  GetReportResponse,
  SpeechData,
  SpeechLinkData,
} from '@/api/reports/getReport'
import { NoticeHighlighting } from '@/components/reports/NoticeHighlighting'
import { NoticeSpeechLink } from '@/components/reports/NoticeSpeechLink'
import { RowSpeech } from '@/components/reports/RowSpeech'
import {
  SPEECH_LINK_MISSING_NOTICE,
  SPEECH_LINK_MOVED_NOTICE,
  SPEECH_LINK_NOTICE_ID,
} from '@/constants/reports/constants'
import { SpeechKind, SpeechLinkStatus } from '@/constants/reports/enums'
import { buildHighlightPattern } from '@/lib/highlight'
import { isLinkedSpeech } from '@/lib/linkedSpeech'
import { Fragment, useEffect } from 'react'

interface ListSpeechesProps {
  report: GetReportResponse
  highlightTerms: string[]
  highlightWords: string[]
}

function getScrollTargetId(speechLink: SpeechLinkData | null): string {
  if (speechLink !== null && speechLink.ordinal !== null) {
    return `s${speechLink.ordinal}`
  }
  return window.location.hash.slice(1)
}

function scrollToLinkedSpeech(speechLink: SpeechLinkData | null) {
  const targetId = getScrollTargetId(speechLink)
  if (targetId === '') return
  const speechElement = document.getElementById(targetId)
  if (!speechElement) return
  const noticeElement = document.getElementById(SPEECH_LINK_NOTICE_ID)
  const scrollTargetElement = noticeElement ?? speechElement
  scrollTargetElement.scrollIntoView()
  speechElement.focus({ preventScroll: true })
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

export function ListSpeeches({
  report,
  highlightTerms,
  highlightWords,
}: ListSpeechesProps) {
  useEffect(
    function scrollToSpeechOnLoad() {
      scrollToLinkedSpeech(report.speech_link)
    },
    [report.speech_link]
  )
  const isSpeechLinkMissing =
    report.speech_link?.status === SpeechLinkStatus.MISSING
  const movedSpeechOrdinal =
    report.speech_link?.status === SpeechLinkStatus.MOVED
      ? report.speech_link.ordinal
      : null
  const highlightPattern = buildHighlightPattern(highlightWords)
  const hasColumnMarkers = report.speeches.some(
    (speech) => typeof speech.column_start === 'number'
  )

  return (
    <section aria-labelledby="speeches-heading">
      <h2 id="speeches-heading" className="sr-only">
        Speeches
      </h2>
      {highlightTerms.length > 0 && (
        <NoticeHighlighting
          reportSlug={report.report_slug}
          terms={highlightTerms}
        />
      )}
      {isSpeechLinkMissing && (
        <NoticeSpeechLink message={SPEECH_LINK_MISSING_NOTICE} />
      )}
      {report.speeches.map((speech, index) => (
        <Fragment key={speech.ordinal}>
          {speech.ordinal === movedSpeechOrdinal && (
            <NoticeSpeechLink message={SPEECH_LINK_MOVED_NOTICE} />
          )}
          <RowSpeech
            speech={speech}
            isContinuation={
              speech.speaker_label !== '' &&
              getPreviousSpeakerLabel(report.speeches, index) ===
                speech.speaker_label
            }
            isLinkedTarget={isLinkedSpeech(
              speech.ordinal,
              report.speech_link,
              window.location.hash
            )}
            previousSpeechKind={
              index > 0 ? report.speeches[index - 1].kind : null
            }
            reportSlug={report.report_slug}
            reportTitle={report.title}
            sittingDate={report.sitting_date}
            volumeNumber={report.volume_number}
            parliamentNumber={report.parliament_number}
            officialRecordUrl={report.official_record_url}
            hasColumnMarkers={hasColumnMarkers}
            highlightPattern={highlightPattern}
          />
        </Fragment>
      ))}
    </section>
  )
}
