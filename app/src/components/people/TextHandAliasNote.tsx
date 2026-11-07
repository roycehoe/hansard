import { formatSittingDate } from '@/lib/format'
import type { HandAliasNote } from '@/types/people/interfaces'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm underline underline-offset-4 outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

const SOURCE_SEPARATOR = '; '

interface TextHandAliasNoteProps {
  personName: string
  handAliasNote: HandAliasNote | undefined
}

export function TextHandAliasNote({
  personName,
  handAliasNote,
}: TextHandAliasNoteProps) {
  if (handAliasNote === undefined) return null

  return (
    <div className="border-separator border-t pt-4">
      <p className="text-muted-foreground max-w-prose text-sm">
        The attendance list of{' '}
        <Link
          to="/sittings/$sittingDate"
          params={{ sittingDate: handAliasNote.sittingDate }}
          className={LINK_CLASS_NAME}
        >
          {formatSittingDate(handAliasNote.sittingDate)}
        </Link>{' '}
        prints &quot;{handAliasNote.printedName}&quot;. The record never says
        that this is {personName}, so I linked the entry to this page by hand.
        Sources:{' '}
        {handAliasNote.sources.map((source, index) => (
          <Fragment key={source.url}>
            {index > 0 && SOURCE_SEPARATOR}
            <a
              href={source.url}
              className={LINK_CLASS_NAME}
              target="_blank"
              rel="noreferrer"
            >
              {source.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Fragment>
        ))}
        .
      </p>
    </div>
  )
}
