import { getPartyNoteId } from '@/lib/utils'
import type { PartyNote } from '@/types/people/interfaces'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

interface TextPartyNoteMarkerProps {
  partyNote: PartyNote | undefined
}

export function TextPartyNoteMarker({ partyNote }: TextPartyNoteMarkerProps) {
  if (partyNote === undefined) return null

  return (
    <sup className="ml-1 text-xs">
      <a
        href={`#${getPartyNoteId(partyNote.number)}`}
        aria-label={`${partyNote.number}, party note`}
        className={LINK_CLASS_NAME}
      >
        {partyNote.number}
      </a>
    </sup>
  )
}
