import type { ReferencedReportData } from '@/api/reports/getReport'
import { Link } from '@tanstack/react-router'

interface NoticeReferencedReportProps {
  label: string
  report: ReferencedReportData
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

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
        className={LINK_CLASS_NAME}
      >
        {report.title}
      </Link>
    </p>
  )
}
