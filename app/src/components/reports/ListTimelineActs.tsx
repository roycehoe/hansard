import type { ReportBillActData } from '@/api/reports/getReport'
import { Link } from '@tanstack/react-router'

interface ListTimelineActsProps {
  acts: ReportBillActData[]
}

export function ListTimelineActs({ acts }: ListTimelineActsProps) {
  return (
    <ul className="px-1 pb-1">
      {acts.map((act) => (
        <li
          key={act.sso_code}
          className="border-separator border-b text-sm last:border-b-0"
        >
          <Link
            to="/acts/$ssoCode"
            params={{ ssoCode: act.sso_code }}
            className="text-link visited:text-visited focus-visible:decoration-ring block px-3 py-2 font-medium break-words outline-hidden hover:underline focus-visible:underline"
          >
            {act.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
