import type { ParliamentData } from '@/api/parliaments/getAllParliaments'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

interface ListParliamentsProps {
  parliaments: ParliamentData[]
}

export function ListParliaments({ parliaments }: ListParliamentsProps) {
  return (
    <ul>
      {parliaments.map((parliament) => (
        <li
          key={parliament.parliament_number}
          className="border-separator border-b py-3 last:border-b-0"
        >
          <Link
            to="/sittings"
            search={{ parliament: parliament.parliament_number }}
            className="text-link focus-visible:outline-ring flex flex-col gap-1 rounded-sm outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid"
          >
            <span className="text-base font-medium">
              {formatParliament(parliament.parliament_number)}
            </span>
            <span className="text-muted-foreground text-sm">
              {parliament.sitting_count.toLocaleString(NUMBER_LOCALE)} sittings,{' '}
              {parliament.report_count.toLocaleString(NUMBER_LOCALE)} reports,{' '}
              {formatSittingDate(parliament.first_sitting_date)} to{' '}
              {formatSittingDate(parliament.last_sitting_date)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
