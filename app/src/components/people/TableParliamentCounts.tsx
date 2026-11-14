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
  BILL_DEFINITION,
  NUMBER_LOCALE,
  QUESTION_DEFINITION,
} from '@/constants/constants'
import { PersonBillsFilter } from '@/constants/people/enums'
import { formatParliament } from '@/lib/format'
import { getPersonBillsAnchorId } from '@/lib/personBills'
import { Link, useLocation } from '@tanstack/react-router'
import type { MouseEvent } from 'react'

const NUMBER_HEAD_CLASS_NAME = 'text-right whitespace-normal sm:pl-8'

const NUMBER_CELL_CLASS_NAME = 'text-right tabular-nums sm:pl-8'

interface TableParliamentCountsProps {
  parliamentCounts: ParliamentCountData[]
  parliamentToBillCount: Map<number, number> | undefined
  personSlug: string
}

export function TableParliamentCounts({
  parliamentCounts,
  parliamentToBillCount,
  personSlug,
}: TableParliamentCountsProps) {
  const hash = useLocation({ select: (location) => location.hash })

  function jumpToShownParliament(event: MouseEvent<HTMLAnchorElement>) {
    const anchorId = event.currentTarget.hash.slice(1)
    const heading = document.getElementById(anchorId)
    if (anchorId !== hash || heading === null) return
    event.preventDefault()
    heading.scrollIntoView()
    heading.focus({ preventScroll: true })
  }

  function renderBillCount(parliamentNumber: number) {
    if (parliamentToBillCount === undefined) return null
    const billCount = parliamentToBillCount.get(parliamentNumber) ?? 0
    const formattedBillCount = billCount.toLocaleString(NUMBER_LOCALE)
    if (billCount === 0) return formattedBillCount
    return (
      <Link
        to="/people/$personSlug"
        params={{ personSlug }}
        search={{ filter: PersonBillsFilter.BILLS }}
        hash={getPersonBillsAnchorId(parliamentNumber)}
        hashScrollIntoView={false}
        onClick={jumpToShownParliament}
        className="text-link focus-visible:decoration-ring outline-hidden hover:underline focus-visible:underline"
      >
        {formattedBillCount}
      </Link>
    )
  }

  return (
    <Table className="w-auto">
      <TableCaption className="sr-only">Activity by Parliament</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="whitespace-normal">
            Parliament
          </TableHead>
          <TableHead scope="col" className={NUMBER_HEAD_CLASS_NAME}>
            Paragraphs
          </TableHead>
          <TableHead scope="col" className={NUMBER_HEAD_CLASS_NAME}>
            <TooltipDefinition definition={QUESTION_DEFINITION}>
              <span className={DEFINED_TERM_CLASS_NAME}>Questions asked</span>
            </TooltipDefinition>
          </TableHead>
          <TableHead scope="col" className={NUMBER_HEAD_CLASS_NAME}>
            <TooltipDefinition definition={BILL_DEFINITION}>
              <span className={DEFINED_TERM_CLASS_NAME}>Bills</span>
            </TooltipDefinition>
          </TableHead>
          <TableHead scope="col" className={NUMBER_HEAD_CLASS_NAME}>
            Present
          </TableHead>
          <TableHead scope="col" className={NUMBER_HEAD_CLASS_NAME}>
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
            <TableCell className={NUMBER_CELL_CLASS_NAME}>
              {count.speech_count.toLocaleString(NUMBER_LOCALE)}
            </TableCell>
            <TableCell className={NUMBER_CELL_CLASS_NAME}>
              {count.questions_asked_count.toLocaleString(NUMBER_LOCALE)}
            </TableCell>
            <TableCell className={NUMBER_CELL_CLASS_NAME}>
              {renderBillCount(count.parliament_number)}
            </TableCell>
            <TableCell className={NUMBER_CELL_CLASS_NAME}>
              {count.present_count.toLocaleString(NUMBER_LOCALE)}
            </TableCell>
            <TableCell className={NUMBER_CELL_CLASS_NAME}>
              {count.absent_count.toLocaleString(NUMBER_LOCALE)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
