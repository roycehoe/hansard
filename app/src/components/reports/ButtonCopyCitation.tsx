import { Button } from '@/components/ui/button'
import { buildReportCite } from '@/lib/citation'
import { formatCalendarDate } from '@/lib/format'
import { copyTextWithToast } from '@/lib/utils'
import { Quote } from 'lucide-react'

interface ButtonCopyCitationProps {
  citation: string
  reportTitle: string
  reportSlug: string
  officialRecordUrl: string
}

export function ButtonCopyCitation({
  citation,
  reportTitle,
  reportSlug,
  officialRecordUrl,
}: ButtonCopyCitationProps) {
  function copyCitation() {
    return copyTextWithToast(
      buildReportCite(
        citation,
        reportTitle,
        reportSlug,
        officialRecordUrl,
        formatCalendarDate(new Date())
      ),
      'Citation copied',
      "Couldn't copy the citation"
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyCitation}>
      <Quote aria-hidden="true" />
      Copy citation
    </Button>
  )
}
