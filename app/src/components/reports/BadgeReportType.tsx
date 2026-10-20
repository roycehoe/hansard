import { Badge } from '@/components/ui/badge'
import { REPORT_TYPE_LABELS } from '@/constants/reports/constants'
import type { ReportType } from '@/constants/reports/enums'

interface BadgeReportTypeProps {
  reportType: string
  className?: string
}

export function BadgeReportType({
  reportType,
  className,
}: BadgeReportTypeProps) {
  return (
    <Badge variant="tag" className={className}>
      {REPORT_TYPE_LABELS[reportType as ReportType] ?? reportType}
    </Badge>
  )
}
