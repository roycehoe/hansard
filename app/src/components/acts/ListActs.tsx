import type { ActSummaryData } from '@/api/acts/getAllActs'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { NUMBER_LOCALE } from '@/constants/constants'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

interface ListActsProps {
  acts: ActSummaryData[]
}

export function ListActs({ acts }: ListActsProps) {
  if (acts.length === 0) {
    return (
      <NoticeEmpty
        icon={SearchX}
        title="No Acts match this title"
        description="Try fewer words or a different spelling."
      />
    )
  }

  return (
    <div className="space-y-2">
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {acts.length.toLocaleString(NUMBER_LOCALE)}{' '}
        {acts.length === 1 ? 'Act' : 'Acts'}
      </p>
      <ul>
        {acts.map((act) => (
          <li
            key={act.sso_code}
            className="border-separator border-b py-3 last:border-b-0"
          >
            <Link
              to="/acts/$ssoCode"
              params={{ ssoCode: act.sso_code }}
              className="text-link focus-visible:decoration-ring font-semibold outline-hidden hover:underline focus-visible:underline"
            >
              {act.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
