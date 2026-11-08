import {
  SPELLING_NOTE_ID,
  SPELLING_NOTE_NUMBER,
} from '@/constants/people/constants'

const LINK_CLASS_NAME =
  'text-link focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

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
