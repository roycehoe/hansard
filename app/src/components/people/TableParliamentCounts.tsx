import type { ParliamentCountData } from '@/api/people/getPerson'
import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ABSENCE_DEFINITION, NUMBER_LOCALE } from '@/constants/constants'
import { formatParliament } from '@/lib/format'

interface TableParliamentCountsProps {
  parliamentCounts: ParliamentCountData[]
}

export function TableParliamentCounts({
  parliamentCounts,
}: TableParliamentCountsProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableCaption className="sr-only">
          Speeches and attendance by Parliament
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="whitespace-normal">
              Parliament
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              Speeches
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              Present
            </TableHead>
            <TableHead scope="col" className="text-right whitespace-normal">
              <PopoverDefinition definition={ABSENCE_DEFINITION}>
                <span className={DEFINED_TERM_CLASS_NAME}>Absent</span>
              </PopoverDefinition>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parliamentCounts.map((count) => (
            <TableRow key={count.parliament_number}>
              <TableCell className="whitespace-normal">
                {formatParliament(count.parliament_number)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {count.speech_count.toLocaleString(NUMBER_LOCALE)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {count.present_count.toLocaleString(NUMBER_LOCALE)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {count.absent_count.toLocaleString(NUMBER_LOCALE)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-sm">
        Attendance is counted from the sitting lists, and the counts are not a
        score.
      </p>
    </div>
  )
}
