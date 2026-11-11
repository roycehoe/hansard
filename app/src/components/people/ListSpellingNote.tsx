import { SPELLING_NOTE_ID } from '@/constants/people/constants'
import { PersonNameSpellingKind } from '@/constants/people/enums'
import { splitSpellingNote } from '@/lib/spellingNote'
import type {
  PersonNameSpellingData,
  SpellingNoteSegment,
} from '@/types/people/interfaces'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

const LINK_CLASS_NAME =
  'text-link underline underline-offset-4 outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

const REPORT_PATH_PREFIX = '/reports/'

function renderSegment({ text, url }: SpellingNoteSegment) {
  if (url === undefined) return text
  if (url.startsWith(REPORT_PATH_PREFIX)) {
    return (
      <Link
        to="/reports/$reportSlug"
        params={{ reportSlug: url.slice(REPORT_PATH_PREFIX.length) }}
        className={LINK_CLASS_NAME}
      >
        {text}
      </Link>
    )
  }
  return (
    <a href={url} className={LINK_CLASS_NAME} target="_blank" rel="noreferrer">
      {text}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

interface ListSpellingNoteProps {
  nameSpellings: PersonNameSpellingData[]
}

export function ListSpellingNote({ nameSpellings }: ListSpellingNoteProps) {
  const hasTransliteration = nameSpellings.some(
    ({ kind }) => kind === PersonNameSpellingKind.TRANSLITERATION
  )

  return (
    <li id={SPELLING_NOTE_ID} className="space-y-1">
      <p className="text-foreground font-medium">Spelling</p>
      <ul className="space-y-1">
        {nameSpellings.map(({ spelling, note }) => (
          <li key={spelling}>
            <span className="text-foreground">{`${spelling}.`}</span>{' '}
            {splitSpellingNote(note).map((segment, index) => (
              <Fragment key={index}>{renderSegment(segment)}</Fragment>
            ))}
          </li>
        ))}
      </ul>
      {hasTransliteration && (
        <p>
          The two are the same name, written in English letters in different
          ways.
        </p>
      )}
    </li>
  )
}
