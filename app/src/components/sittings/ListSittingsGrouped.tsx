import type { SittingData } from '@/api/sittings/getAllSittings'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'

interface ListSittingsGroupedProps {
  sittings: SittingData[]
}

export function ListSittingsGrouped({ sittings }: ListSittingsGroupedProps) {
  const isGroupedBySession = sittings.every(
    (sitting) => sitting.session_number !== null
  )

  const groups = useMemo(() => {
    const sittingsByGroupKey = new Map<number, SittingData[]>()
    for (const sitting of [...sittings].reverse()) {
      const groupKey = isGroupedBySession
        ? sitting.session_number
        : sitting.volume_number
      if (groupKey === null) continue
      sittingsByGroupKey.set(groupKey, [
        ...(sittingsByGroupKey.get(groupKey) ?? []),
        sitting,
      ])
    }
    return [...sittingsByGroupKey.entries()]
  }, [sittings, isGroupedBySession])

  return (
    <div className="space-y-8">
      {groups.map(([groupKey, groupSittings]) => (
        <section key={groupKey} className="space-y-2">
          <h2 className="font-serif text-xl lg:text-2xl">
            {isGroupedBySession ? `Session ${groupKey}` : `Volume ${groupKey}`}
          </h2>
          <ol>
            {groupSittings.map((sitting) => (
              <li
                key={sitting.sitting_date}
                className="border-separator border-b py-3 last:border-b-0"
              >
                <Link
                  to="/sittings/$sittingDate"
                  params={{ sittingDate: sitting.sitting_date }}
                  className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background flex flex-wrap gap-x-4 gap-y-1 rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <span className="font-medium">
                    {formatSittingDate(sitting.sitting_date)}
                  </span>
                  {sitting.sitting_number !== null && (
                    <span>Sitting {sitting.sitting_number}</span>
                  )}
                  {isGroupedBySession && (
                    <span>Volume {sitting.volume_number}</span>
                  )}
                  <span className="text-muted-foreground">
                    {sitting.report_count}{' '}
                    {sitting.report_count === 1 ? 'report' : 'reports'}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
