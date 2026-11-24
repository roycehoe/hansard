import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import {
  REPORT_TYPE_DESCRIPTIONS,
  REPORT_TYPES_LINK_LABEL,
} from '@/constants/reports/constants'
import type { ReportType } from '@/constants/reports/enums'
import { cn } from '@/lib/utils'

interface PopoverReportTypeProps {
  reportType: ReportType
}

export function PopoverReportType({ reportType }: PopoverReportTypeProps) {
  const definition = REPORT_TYPE_DESCRIPTIONS[reportType]
  const badge = (
    <BadgeReportType
      reportType={reportType}
      className={cn(definition && DEFINED_TERM_CLASS_NAME)}
    />
  )
  if (!definition) return badge
  return (
    <PopoverDefinition
      definition={definition}
      termsLinkLabel={REPORT_TYPES_LINK_LABEL}
    >
      {badge}
    </PopoverDefinition>
  )
}
