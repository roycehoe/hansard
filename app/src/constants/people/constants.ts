import { LATEST_MEMBERSHIP_PARLIAMENT_NUMBER } from '@/constants/reports/constants'
import { formatParliament } from '@/lib/format'

export const FILTER_ALL = 'all'

export const PARLIAMENT_DROPDOWN_OPTIONS = Array.from(
  { length: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER + 1 },
  (_, parliamentNumber) => ({
    value: String(parliamentNumber),
    label: formatParliament(parliamentNumber),
  })
)
