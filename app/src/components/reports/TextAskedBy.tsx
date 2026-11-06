import type { AskerData } from '@/api/reports/getReport'
import { PopoverReadOutBy } from '@/components/reports/PopoverReadOutBy'
import { getNameListSeparator } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

interface TextAskedByProps {
  askers: AskerData[]
}

const LINK_CLASS_NAME =
  'text-primary visited:text-visited hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-medium outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function TextAskedBy({ askers }: TextAskedByProps) {
  if (askers.length === 0) return null

  return (
    <p className="text-muted-foreground text-sm">
      Asked by{' '}
      {askers.map((asker, askerIndex) => (
        <Fragment key={asker.person_id}>
          {getNameListSeparator(askerIndex, askers.length)}
          <Link
            to="/people/$personSlug"
            params={{ personSlug: `${asker.person_id}-${asker.person_slug}` }}
            className={LINK_CLASS_NAME}
          >
            {asker.person_name}
          </Link>
          {asker.reader_person_name !== '' && (
            <>
              {' '}
              <PopoverReadOutBy
                printedName={asker.printed_name}
                readerName={asker.reader_person_name}
              />
            </>
          )}
        </Fragment>
      ))}
    </p>
  )
}
