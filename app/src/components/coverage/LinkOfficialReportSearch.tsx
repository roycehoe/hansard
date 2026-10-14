import { OFFICIAL_RECORD_SEARCH_URL } from '@/constants/constants'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function LinkOfficialReportSearch() {
  return (
    <a
      href={OFFICIAL_RECORD_SEARCH_URL}
      className={LINK_CLASS_NAME}
      target="_blank"
      rel="noreferrer"
    >
      Search the Official Report
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
