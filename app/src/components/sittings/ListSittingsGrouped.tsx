import type { SittingData } from '@/api/sittings/getAllSittings'
import { ListYearLinks } from '@/components/sittings/ListYearLinks'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatSittingDayMonth } from '@/lib/format'
import { formatSittingRunLabel, groupSittingsByYear } from '@/lib/sittingYears'
import { Link } from '@tanstack/react-router'
import { Fragment, useEffect, useMemo } from 'react'

interface ListSittingsGroupedProps {
  sittings: SittingData[]
  parliamentNumber: number
  isFirstLoad: boolean
}

export function ListSittingsGrouped({
  sittings,
  parliamentNumber,
  isFirstLoad,
}: ListSittingsGroupedProps) {
  const sittingYears = useMemo(() => groupSittingsByYear(sittings), [sittings])
  const years = useMemo(
    () => sittingYears.map((sittingYear) => sittingYear.year),
    [sittingYears]
  )

  useEffect(
    function scrollToLinkedYearOnFirstLoad() {
      if (!isFirstLoad) return
      const heading = document.getElementById(window.location.hash.slice(1))
      heading?.scrollIntoView()
      heading?.focus({ preventScroll: true })
    },
    [isFirstLoad]
  )

  if (years.length === 0) return null

  return (
    <div className="-mt-6 space-y-8">
      <ListYearLinks years={years} parliamentNumber={parliamentNumber} />
      {sittingYears.map(({ year, runs }) => (
        <section key={year} data-year={year}>
          <h2
            id={String(year)}
            tabIndex={-1}
            className="mb-1 scroll-mt-14 font-serif text-xl outline-hidden lg:text-2xl"
          >
            {year}
          </h2>
          {runs.map((run) => (
            <Fragment key={run.sittings[0].sitting_date}>
              <h3 className="text-muted-foreground mt-4 pb-1 text-sm font-medium first-of-type:mt-0">
                {formatSittingRunLabel(run)}
              </h3>
              <ol className="sm:max-w-120">
                {run.sittings.map((sitting) => (
                  <li
                    key={sitting.sitting_date}
                    className="border-separator border-b last:border-b-0"
                  >
                    <Link
                      to="/sittings/$sittingDate"
                      params={{ sittingDate: sitting.sitting_date }}
                      className="text-link visited:text-visited focus-visible:outline-ring grid min-h-11 scroll-mt-14 grid-cols-[1fr_84px_96px] items-center gap-x-2 rounded-sm outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid"
                    >
                      <span className="font-medium">
                        {formatSittingDayMonth(sitting.sitting_date)}
                        <span className="sr-only"> {year}</span>
                      </span>
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {sitting.sitting_number !== null && (
                          <>
                            Sitting {sitting.sitting_number}
                            <span className="sr-only">,</span>
                          </>
                        )}
                      </span>
                      <span className="text-muted-foreground text-right text-sm tabular-nums">
                        {sitting.report_count.toLocaleString(NUMBER_LOCALE)}{' '}
                        {sitting.report_count === 1 ? 'report' : 'reports'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </Fragment>
          ))}
        </section>
      ))}
    </div>
  )
}
