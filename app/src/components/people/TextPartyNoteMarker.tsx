import { LINK_CLASS_NAME } from '@/constants/constants'
import { getPartyNoteId } from '@/lib/utils'
import type { PartyNote } from '@/types/people/interfaces'

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
