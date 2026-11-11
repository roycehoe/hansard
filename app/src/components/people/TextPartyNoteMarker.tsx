import { getPartyNoteId } from '@/lib/utils'
import type { PartyNote } from '@/types/people/interfaces'

const LINK_CLASS_NAME =
  'text-link focus-visible:outline-ring rounded-sm outline-hidden hover:underline focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-2'

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
