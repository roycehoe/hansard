import { NUMBER_LOCALE } from '@/constants/constants'
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

const PERCENT_SCALE = 100

function formatTextShare(year: YearCoverageData): string {
  if (year.report_count === 0) return '0%'
  return `${Math.round((PERCENT_SCALE * year.text_report_count) / year.report_count)}%`
}

interface TableCoverageYearsProps {
  years: YearCoverageData[]
}

export function TableCoverageYears({ years }: TableCoverageYearsProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Reports with text by year</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Year</TableHead>
          <TableHead scope="col" className="text-right">Reports</TableHead>
          <TableHead scope="col" className="text-right">With text</TableHead>
          <TableHead scope="col" className="text-right">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {years.map((year) => (
          <TableRow key={year.year}>
            <TableCell>{year.year}</TableCell>
            <TableCell className="text-right tabular-nums">{year.report_count.toLocaleString(NUMBER_LOCALE)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {year.text_report_count.toLocaleString(NUMBER_LOCALE)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatTextShare(year)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
