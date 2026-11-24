import { LinkExternal } from '@/components/layout/LinkExternal'
import { formatSittingDate } from '@/lib/format'
import type { HandAliasNote } from '@/types/people/interfaces'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const LINK_CLASS_NAME =
  'text-link underline underline-offset-4 outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

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
        that this is {personName}. The entry was linked to this page by hand.
        Sources:{' '}
        {handAliasNote.sources.map((source, index) => (
          <Fragment key={source.url}>
            {index > 0 && SOURCE_SEPARATOR}
            <LinkExternal href={source.url}>{source.label}</LinkExternal>
          </Fragment>
        ))}
        .
      </p>
    </div>
  )
}
