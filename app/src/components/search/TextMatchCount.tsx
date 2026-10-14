import { NUMBER_LOCALE } from '@/constants/constants'

interface TextMatchCountProps {
  page: number
  pageSize: number
  shownCount: number
  totalCount: number
  isTotalCapped: boolean
  singularNoun: string
  pluralNoun: string
}

export function TextMatchCount({
  page,
  pageSize,
  shownCount,
  totalCount,
  isTotalCapped,
  singularNoun,
  pluralNoun,
}: TextMatchCountProps) {
  const firstShown = (page - 1) * pageSize + 1
  const lastShown = firstShown + shownCount - 1
  const total = totalCount.toLocaleString(NUMBER_LOCALE)
  const totalPhrase = isTotalCapped ? `more than ${total}` : total
  const noun = totalCount === 1 && !isTotalCapped ? singularNoun : pluralNoun
  const announcement = isTotalCapped
    ? `More than ${total} ${noun}`
    : `${total} ${noun}`

  return (
    <>
      <p aria-hidden="true" className="text-muted-foreground text-sm">
        Showing {firstShown.toLocaleString(NUMBER_LOCALE)} to{' '}
        {lastShown.toLocaleString(NUMBER_LOCALE)} of {totalPhrase}
      </p>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  )
}
