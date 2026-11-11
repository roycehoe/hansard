import type { ReferencedReportData } from '@/api/reports/getReport'
import { Link } from '@tanstack/react-router'

interface NoticeReferencedReportProps {
  label: string
  report: ReferencedReportData
}

const LINK_CLASS_NAME =
  'text-link visited:text-visited focus-visible:outline-ring rounded-sm font-medium outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-2'

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
