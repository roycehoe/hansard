import type { GetReportResponse } from '@/api/reports/getReport'
import { formatParliament } from '@/lib/format'

interface ListReportMetadataProps {
  report: GetReportResponse
}

export function ListReportMetadata({ report }: ListReportMetadataProps) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-1">
      <li>{formatParliament(report.parliament_number)}</li>
      <li>Volume {report.volume_number}</li>
      {report.sitting_number !== null && (
        <li>Sitting {report.sitting_number}</li>
      )}
    </ul>
  )
}
