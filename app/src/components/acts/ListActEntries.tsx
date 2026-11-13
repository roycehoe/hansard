import type { ActEntryData } from '@/api/acts/getAct'
import { ListActEntryReports } from '@/components/acts/ListActEntryReports'
import { ActHistoryEntryKind } from '@/constants/bills/enums'

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
      {entries.map((entry) => (
        <li
          key={entry.ordinal}
          className="border-separator space-y-2 border-b py-4 last:border-b-0"
        >
          <h2 className="font-serif text-base font-semibold break-words lg:text-lg">
            {entry.printed_title}
          </h2>
          {entry.kind === ActHistoryEntryKind.REVISED_EDITION && (
            <p className="text-muted-foreground text-sm">
              {entry.printed_law_number}
            </p>
          )}
          {entry.bill !== null && (
            <ListActEntryReports
              billTitle={entry.bill.title}
              reports={entry.bill.reports}
            />
          )}
        </li>
      ))}
    </ol>
  )
}
