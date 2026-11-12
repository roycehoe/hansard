import type { ActEntryData } from '@/api/acts/getAct'
import { ListActEntryReports } from '@/components/acts/ListActEntryReports'
import {
  FIRST_READING_LABEL,
  SECOND_READING_LABEL,
  THIRD_READING_LABEL,
} from '@/constants/bills/constants'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatSittingDate } from '@/lib/format'

function getReadingDateTexts(entry: ActEntryData): string[] {
  return [
    { label: FIRST_READING_LABEL, date: entry.first_reading_date },
    { label: SECOND_READING_LABEL, date: entry.second_reading_date },
    { label: THIRD_READING_LABEL, date: entry.third_reading_date },
  ].flatMap(({ label, date }) =>
    date === null ? [] : [`${label} ${formatSittingDate(date)}`]
  )
}

interface ListActEntriesProps {
  entries: ActEntryData[]
}

export function ListActEntries({ entries }: ListActEntriesProps) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No amendments are listed for this Act.
      </p>
    )
  }

  return (
    <ol>
      {entries.map((entry) => {
        const readingDateTexts = getReadingDateTexts(entry)
        return (
          <li
            key={entry.ordinal}
            className="border-separator space-y-2 border-b py-4 last:border-b-0"
          >
            <h2 className="font-serif text-base font-semibold break-words lg:text-lg">
              {entry.printed_title}
            </h2>
            <p className="text-muted-foreground text-sm">
              {entry.printed_law_number}
            </p>
            {readingDateTexts.length > 0 && (
              <p className="text-muted-foreground text-sm">
                {readingDateTexts.join(', ')}
              </p>
            )}
            {entry.bill !== null && (
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="font-medium">{entry.bill.title}</p>
                  {entry.bill.act_count > 1 && (
                    <span className="text-muted-foreground text-sm">
                      Changed{' '}
                      {entry.bill.act_count.toLocaleString(NUMBER_LOCALE)} Acts
                    </span>
                  )}
                </div>
                <ListActEntryReports reports={entry.bill.reports} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
