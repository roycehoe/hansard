import type { GetReportResponse } from '@/api/reports/getReport'
import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'

interface ListReportMetadataProps {
  report: GetReportResponse
}

export function ListReportMetadata({ report }: ListReportMetadataProps) {
  const facts = [
    {
      label: 'Parliament',
      value:
        report.parliament_number === LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER
          ? LEGISLATIVE_ASSEMBLY_LABEL
          : report.parliament_number,
    },
    { label: 'Volume', value: report.volume_number },
    ...(report.sitting_number !== null
      ? [{ label: 'Sitting', value: report.sitting_number }]
      : []),
  ]

  return (
    <dl className="flex flex-wrap gap-x-5">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground text-sm">{fact.label}</dt>
          <dd className="text-base leading-5 font-medium tabular-nums">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
