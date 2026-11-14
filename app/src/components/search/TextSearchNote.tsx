import { AnalyticsEvent } from '@/constants/analytics/enums'
import { SEARCH_WORDS_INPUT_ID } from '@/constants/search/constants'
import { countEvent } from '@/lib/analytics'
import { Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

function followNoteLink() {
  countEvent(AnalyticsEvent.SEARCH_NOTE_LINK)
  document.getElementById(SEARCH_WORDS_INPUT_ID)?.focus()
}

function followNoteActLink() {
  countEvent(AnalyticsEvent.SEARCH_NOTE_LINK)
}

interface SearchNoteLinkSearch {
  q: string
  from?: string
  to?: string
  person?: number
  act?: string
}

type TextSearchNoteProps = { note: string; linkLabel: string } & (
  | { linkSearch: SearchNoteLinkSearch; linkActCode?: never }
  | { linkActCode: string; linkSearch?: never }
)

export function TextSearchNote({
  note,
  linkLabel,
  linkSearch,
  linkActCode,
}: TextSearchNoteProps) {
  return (
    <p className="text-muted-foreground text-sm">
      {note}{' '}
      {linkActCode === undefined ? (
        <Link
          to="/search"
          search={(previous) => ({ ...previous, ...linkSearch })}
          onClick={followNoteLink}
          className={LINK_CLASS_NAME}
        >
          {linkLabel}
        </Link>
      ) : (
        <Link
          to="/acts/$ssoCode"
          params={{ ssoCode: linkActCode }}
          onClick={followNoteActLink}
          className={LINK_CLASS_NAME}
        >
          {linkLabel}
        </Link>
      )}
    </p>
  )
}
