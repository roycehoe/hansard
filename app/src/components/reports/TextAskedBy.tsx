import type { AskerData } from '@/api/reports/getReport'
import { PopoverReadOutBy } from '@/components/reports/PopoverReadOutBy'
import { EMPHASISED_LINK_CLASS_NAME } from '@/constants/constants'
import { getNameListSeparator } from '@/lib/format'
import { buildPersonSlug } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

interface TextAskedByProps {
  askers: AskerData[]
}

export function TextAskedBy({ askers }: TextAskedByProps) {
  return askers.length === 0 ? null : (
    <p className="text-muted-foreground text-sm">
      Asked by{' '}
      {askers.map((asker, askerIndex) => (
        <Fragment key={asker.person_id}>
          {getNameListSeparator(askerIndex, askers.length)}
          <Link
            to="/people/$personSlug"
            params={{
              personSlug: buildPersonSlug(asker.person_id, asker.person_slug),
            }}
            className={EMPHASISED_LINK_CLASS_NAME}
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
