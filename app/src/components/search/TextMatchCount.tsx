import { NUMBER_LOCALE } from '@/constants/constants'
import { SEARCH_WORD_FORMS_NOTE } from '@/constants/search/constants'
import type { ReactNode } from 'react'

interface TextMatchCountProps {
  shownCount?: number
  totalCount: number
  isTotalCapped: boolean
  singularNoun: string
  pluralNoun: string
  hasWords: boolean
  sortControl: ReactNode
}

export function TextMatchCount({
  shownCount,
  totalCount,
  isTotalCapped,
  singularNoun,
  pluralNoun,
  hasWords,
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
        </p>
      )}
    </div>
  )
}
