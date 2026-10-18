import { getPartyNoteId } from '@/lib/utils'
import type { PartyNote } from '@/types/people/interfaces'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

interface TextPartyNoteMarkerProps {
  partyNote: PartyNote | undefined
}

export function TextPartyNoteMarker({ partyNote }: TextPartyNoteMarkerProps) {
  if (partyNote === undefined) return null

  return (
    <sup className="ml-1 text-xs">
      <a
        href={`#${getPartyNoteId(partyNote.number)}`}
        aria-label={`Party note ${partyNote.number}`}
        className={LINK_CLASS_NAME}
      >
        {partyNote.number}
      </a>
    </sup>
  )
}
