import { NUMBER_LOCALE } from '@/constants/constants'
import {
  SEARCH_WORD_FORMS_NOTE,
  SEARCH_WORDS_INPUT_ID,
} from '@/constants/search/constants'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

function focusSearchWords() {
  document.getElementById(SEARCH_WORDS_INPUT_ID)?.focus()
}

interface TextMatchCountProps {
  shownCount?: number
  totalCount: number
  isTotalCapped: boolean
  singularNoun: string
  pluralNoun: string
  hasWords: boolean
  exactWord: string | undefined
  sortControl: ReactNode
}

export function TextMatchCount({
  shownCount,
  totalCount,
  isTotalCapped,
  singularNoun,
  pluralNoun,
  hasWords,
  exactWord,
  sortControl,
}: TextMatchCountProps) {
  const total = totalCount.toLocaleString(NUMBER_LOCALE)
  const totalPhrase = isTotalCapped ? `more than ${total}` : total
  const noun = totalCount === 1 && !isTotalCapped ? singularNoun : pluralNoun

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {shownCount === undefined ? (
          <p role="status" className="text-muted-foreground text-sm">
            {totalPhrase} {noun}
          </p>
        ) : (
          <p role="status" className="text-muted-foreground text-sm">
            Showing {shownCount.toLocaleString(NUMBER_LOCALE)} of {totalPhrase}
            <span className="sr-only"> {noun}</span>
          </p>
        )}
        {sortControl}
      </div>
      {hasWords && (
        <p className="text-muted-foreground text-sm">
          {SEARCH_WORD_FORMS_NOTE}
          {exactWord !== undefined && (
            <>
              {' '}
              <Link
                to="/search"
                search={(previous) => ({ ...previous, q: `"${exactWord}"` })}
                onClick={focusSearchWords}
                className={LINK_CLASS_NAME}
              >
                Only the exact word {exactWord}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}
