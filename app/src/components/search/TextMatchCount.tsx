import { NUMBER_LOCALE } from '@/constants/constants'

interface TextMatchCountProps {
  shownCount: number
  totalCount: number
  isTotalCapped: boolean
  singularNoun: string
  pluralNoun: string
}

export function TextMatchCount({
  shownCount,
  totalCount,
  isTotalCapped,
  singularNoun,
  pluralNoun,
}: TextMatchCountProps) {
  const total = totalCount.toLocaleString(NUMBER_LOCALE)
  const totalPhrase = isTotalCapped ? `more than ${total}` : total
  const noun = totalCount === 1 && !isTotalCapped ? singularNoun : pluralNoun

  return (
    <p role="status" className="text-muted-foreground text-sm">
      Showing {shownCount.toLocaleString(NUMBER_LOCALE)} of {totalPhrase}
      <span className="sr-only"> {noun}</span>
    </p>
  )
}
