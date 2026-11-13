import { AnalyticsEvent } from '@/constants/analytics/enums'
import { countEvent } from '@/lib/analytics'
import { buildSpeechCite, buildSpeechPermalink } from '@/lib/citation'
import { formatCalendarDate } from '@/lib/format'
import { buildErrorEmailHref, copyTextWithToast } from '@/lib/utils'

export interface SpeechActionContext {
  reportSlug: string
  reportTitle: string
  ordinal: number
  anchor: string
  officialRecordUrl: string
  citation?: string
  speakerLabel: string
  transcript: string
  sittingDate: string
}

export function buildSpeechActions({
  reportSlug,
  reportTitle,
  ordinal,
  anchor,
  officialRecordUrl,
  citation,
}: SpeechActionContext) {
  const speechPermalink = buildSpeechPermalink(reportSlug, ordinal, anchor)

  function copySpeechLink() {
    countEvent(AnalyticsEvent.COPY_LINK)
    return copyTextWithToast(
      speechPermalink,
      'Link copied',
      "Couldn't copy the link"
    )
  }

  function copySpeechCitation() {
    countEvent(AnalyticsEvent.CITE)
    return copyTextWithToast(
      buildSpeechCite(
        citation ?? '',
        reportTitle,
        speechPermalink,
        officialRecordUrl,
        formatCalendarDate(new Date())
      ),
      'Citation copied',
      "Couldn't copy the citation"
    )
  }

  const errorEmailHref = buildErrorEmailHref(
    `Error in ${reportTitle}`,
    speechPermalink
  )

  return { copySpeechLink, copySpeechCitation, errorEmailHref }
}
