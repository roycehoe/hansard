import { formatPartyAffiliationStart, formatSourceUrlHost } from '@/lib/format'
import { getPartyNoteId } from '@/lib/utils'
import type { PartyAffiliationData, PartyNote } from '@/types/people/interfaces'
import { Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

interface ListPartyNotesProps {
  notes: PartyNote[]
}

export function ListPartyNotes({ notes }: ListPartyNotesProps) {
  if (notes.length === 0) return null

  function renderSource(partyAffiliation: PartyAffiliationData) {
    if (partyAffiliation.source_report !== null) {
      return (
        <Link
          to="/reports/$reportSlug"
          params={{ reportSlug: partyAffiliation.source_report.report_slug }}
          className={LINK_CLASS_NAME}
        >
          Hansard
        </Link>
      )
    }
    if (partyAffiliation.source_url !== null) {
      return (
        <a
          href={partyAffiliation.source_url}
          className={LINK_CLASS_NAME}
          target="_blank"
          rel="noreferrer"
        >
          {formatSourceUrlHost(partyAffiliation.source_url)}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )
    }
    return null
  }

  return (
    <section
      aria-label="Party notes"
      className="border-separator text-muted-foreground max-w-prose border-t pt-4 text-sm"
    >
      <ol className="list-decimal space-y-3 pl-5">
        {notes.map((note) => (
          <li
            key={note.number}
            id={getPartyNoteId(note.number)}
            className="space-y-1"
          >
            <p className="text-foreground font-medium">{note.label}</p>
            <ul className="space-y-1">
              {note.partyAffiliations.map((partyAffiliation) => (
                <li
                  key={`${partyAffiliation.started_on}-${partyAffiliation.party}`}
                >
                  <span className="text-foreground">
                    {`${formatPartyAffiliationStart(partyAffiliation)}, ${partyAffiliation.party}.`}
                  </span>{' '}
                  {partyAffiliation.event} {renderSource(partyAffiliation)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
