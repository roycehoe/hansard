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
import {
  ABSENCE_DEFINITION,
  NUMBER_LOCALE,
  QUESTION_COUNT_LINK_LABEL,
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
            <PopoverDefinition
              definition={QUESTION_DEFINITION}
              termsLinkLabel={QUESTION_COUNT_LINK_LABEL}
            >
              <span className={DEFINED_TERM_CLASS_NAME}>Questions asked</span>
            </PopoverDefinition>
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
