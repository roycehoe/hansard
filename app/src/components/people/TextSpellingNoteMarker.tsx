import { LINK_CLASS_NAME } from '@/constants/constants'
import {
  SPELLING_NOTE_ID,
  SPELLING_NOTE_NUMBER,
} from '@/constants/people/constants'

export function TextSpellingNoteMarker() {
  return (
    <sup className="ml-1 text-xs">
      <a
        href={`#${SPELLING_NOTE_ID}`}
        aria-label="Spelling note"
        className={LINK_CLASS_NAME}
      >
        {SPELLING_NOTE_NUMBER}
      </a>
    </sup>
  )
}
