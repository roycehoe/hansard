import type { ReferencedReportData } from '@/api/reports/getReport'
import { VISITED_EMPHASISED_LINK_CLASS_NAME } from '@/constants/constants'
import { Link } from '@tanstack/react-router'

interface NoticeReferencedReportProps {
  label: string
  report: ReferencedReportData
}

export function NoticeReferencedReport({
  label,
  report,
}: NoticeReferencedReportProps) {
  return (
    <p className="text-muted-foreground text-sm">
      {label}:{' '}
      <Link
        to="/reports/$reportSlug"
        params={{ reportSlug: report.report_slug }}
        className={VISITED_EMPHASISED_LINK_CLASS_NAME}
      >
        {report.title}
      </Link>
    </p>
  )
}
