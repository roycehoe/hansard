import { Badge } from '@/components/ui/badge'
import { REPORT_TYPE_LABELS } from '@/constants/reports/constants'
import type { ReportType } from '@/constants/reports/enums'

interface BadgeReportTypeProps {
  reportType: string
}

export function BadgeReportType({ reportType }: BadgeReportTypeProps) {
  return (
    <Badge variant="tag">
      {REPORT_TYPE_LABELS[reportType as ReportType] ?? reportType}
    </Badge>
  )
}
