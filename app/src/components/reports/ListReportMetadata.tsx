import type { GetReportResponse } from '@/api/reports/getReport'
import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'
import { cn } from '@/lib/utils'

interface ListReportMetadataProps {
  report: GetReportResponse
}

export function ListReportMetadata({ report }: ListReportMetadataProps) {
  const isLegislativeAssembly =
    report.parliament_number === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
  const facts = [
    {
      label: 'Parliament',
      value: isLegislativeAssembly
        ? LEGISLATIVE_ASSEMBLY_LABEL
        : report.parliament_number,
      isLabelHidden: isLegislativeAssembly,
    },
    { label: 'Volume', value: report.volume_number },
    ...(report.sitting_number !== null
      ? [{ label: 'Sitting', value: report.sitting_number }]
      : []),
  ]

  return (
    <dl className="text-muted-foreground flex flex-wrap gap-x-5 text-sm tabular-nums">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-baseline gap-1.5">
          <dt className={cn(fact.isLabelHidden && 'sr-only')}>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
