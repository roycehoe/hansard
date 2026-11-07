import { AnalyticsEvent } from '@/constants/analytics/enums'
import { SEARCH_WORDS_INPUT_ID } from '@/constants/search/constants'
import { countEvent } from '@/lib/analytics'
import { Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 underline underline-offset-4'

function followNoteLink() {
  countEvent(AnalyticsEvent.SEARCH_NOTE_LINK)
  document.getElementById(SEARCH_WORDS_INPUT_ID)?.focus()
}

interface TextSearchYearNoteProps {
  otherWords: string
  year: string
  today: string
}

export function TextSearchYearNote({
  otherWords,
  year,
  today,
}: TextSearchYearNoteProps) {
  const lastDayOfYear = `${year}-12-31`

  return (
    <p className="text-muted-foreground text-sm">
      Searching for &quot;{year}&quot; finds mentions of the year, not
      necessarily debates held in {year}.{' '}
      <Link
        to="/search"
        search={(previous) => ({
          ...previous,
          q: otherWords,
          from: `${year}-01-01`,
          to: lastDayOfYear > today ? today : lastDayOfYear,
        })}
        onClick={followNoteLink}
        className={LINK_CLASS_NAME}
      >
        Search for &quot;{otherWords}&quot; in {year} sittings instead
      </Link>
    </p>
  )
}
