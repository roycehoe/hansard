import type { ActSummaryData } from '@/api/acts/getAllActs'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { NUMBER_LOCALE } from '@/constants/constants'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

export interface ActListItem {
  act: ActSummaryData
  isCodeMatch: boolean
}

interface ListActsProps {
  items: ActListItem[]
}

export function ListActs({ items }: ListActsProps) {
  if (items.length === 0) {
    return (
      <NoticeEmpty
        icon={SearchX}
        title="No Acts match"
        description="Try fewer words, a different spelling or the short code."
      />
    )
  }

  return (
    <div className="space-y-2">
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {items.length.toLocaleString(NUMBER_LOCALE)}{' '}
        {items.length === 1 ? 'Act' : 'Acts'}
      </p>
      <ul>
        {items.map(({ act, isCodeMatch }) => (
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
            {isCodeMatch && (
              <p className="text-muted-foreground text-sm">
                Code {act.sso_code}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
