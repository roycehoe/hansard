import type { ParliamentCountData } from '@/api/people/getPerson'
import { DEFINED_TERM_CLASS_NAME } from '@/components/layout/PopoverDefinition'
import { TooltipDefinition } from '@/components/layout/TooltipDefinition'
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
  ABSENCE_DEFINITION,
  NUMBER_LOCALE,
  QUESTION_DEFINITION,
} from '@/constants/constants'
import { formatParliament } from '@/lib/format'

interface TableParliamentCountsProps {
  parliamentCounts: ParliamentCountData[]
}

export function TableParliamentCounts({
  parliamentCounts,
}: TableParliamentCountsProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Activity by Parliament</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="whitespace-normal">
            Parliament
          </TableHead>
          <TableHead scope="col" className="text-right whitespace-normal">
            Paragraphs
          </TableHead>
          <TableHead scope="col" className="text-right whitespace-normal">
            <TooltipDefinition definition={QUESTION_DEFINITION}>
              <span className={DEFINED_TERM_CLASS_NAME}>Questions asked</span>
            </TooltipDefinition>
          </TableHead>
          <TableHead scope="col" className="text-right whitespace-normal">
            Present
          </TableHead>
          <TableHead scope="col" className="text-right whitespace-normal">
            <TooltipDefinition definition={ABSENCE_DEFINITION}>
              <span className={DEFINED_TERM_CLASS_NAME}>Absent</span>
            </TooltipDefinition>
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
              {count.questions_asked_count.toLocaleString(NUMBER_LOCALE)}
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
  )
}
