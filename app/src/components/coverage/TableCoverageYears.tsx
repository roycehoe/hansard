import type { YearCoverageData } from '@/api/coverage/getCoverage'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  NUMBER_LOCALE,
} from '@/constants/constants'
import {
  CHANGEOVER_YEAR,
  LEGISLATIVE_ASSEMBLY_LAST_SITTING,
  PARLIAMENT_ONE_FIRST_SITTING,
} from '@/constants/coverage/constants'
import { formatSittingDayMonth } from '@/lib/format'
import { getYear, parseISO } from 'date-fns'

function getYearNote(
  year: number,
  firstSittingDate: string,
  lastSittingDate: string
): string | null {
  if (year === CHANGEOVER_YEAR) {
    return `${LEGISLATIVE_ASSEMBLY_LABEL} to ${formatSittingDayMonth(LEGISLATIVE_ASSEMBLY_LAST_SITTING)}, Parliament from ${formatSittingDayMonth(PARLIAMENT_ONE_FIRST_SITTING)}`
  }
  if (year === getYear(parseISO(firstSittingDate))) {
    return `From ${formatSittingDayMonth(firstSittingDate)}`
  }
  if (year === getYear(parseISO(lastSittingDate))) {
    return `To ${formatSittingDayMonth(lastSittingDate)}`
  }
  return null
}

interface TableCoverageYearsProps {
  years: YearCoverageData[]
  firstSittingDate: string
  lastSittingDate: string
}

export function TableCoverageYears({
  years,
  firstSittingDate,
  lastSittingDate,
}: TableCoverageYearsProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Reports by year</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Year</TableHead>
          <TableHead scope="col" className="text-right">
            Reports
          </TableHead>
          <TableHead scope="col" className="text-right">
            With text
          </TableHead>
          <TableHead scope="col" className="text-right whitespace-normal">
            Without text
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {years.map((year) => {
          const yearNote = getYearNote(
            year.year,
            firstSittingDate,
            lastSittingDate
          )
          const withoutTextCount = year.report_count - year.text_report_count
          return (
            <TableRow
              key={year.year}
              className="border-separator bg-background h-12 border-b py-4 last:border-b-0"
            >
              <TableHead
                scope="row"
                className="text-foreground align-top whitespace-normal"
              >
                {year.year}
                {yearNote !== null && (
                  <span className="text-muted-foreground block text-xs font-normal">
                    {yearNote}
                  </span>
                )}
              </TableHead>
              <TableCell className="text-right tabular-nums">
                {year.report_count.toLocaleString(NUMBER_LOCALE)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {year.text_report_count.toLocaleString(NUMBER_LOCALE)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {withoutTextCount > 0
                  ? withoutTextCount.toLocaleString(NUMBER_LOCALE)
                  : ''}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
