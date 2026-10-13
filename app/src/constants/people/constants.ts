import { formatParliament } from '@/lib/format'

export const LATEST_MEMBERSHIP_PARLIAMENT_NUMBER = 15

export const PARLIAMENT_DROPDOWN_OPTIONS = Array.from(
  { length: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER + 1 },
  (_, parliamentNumber) => ({
    value: String(parliamentNumber),
    label: formatParliament(parliamentNumber),
  })
)
