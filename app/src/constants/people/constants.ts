export const LATEST_MEMBERSHIP_PARLIAMENT_NUMBER = 15

export const PERSON_TITLE_SUFFIX = 'speeches in Parliament'

export const MEMBERSHIP_PARLIAMENT_NUMBERS = Array.from(
  { length: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER + 1 },
  (_, parliamentNumber) => parliamentNumber
)

// The scraper stores constituency names without the "GRC" or "SMC" suffix
// that readers often type, so a typed suffix would match nothing.
export const CONSTITUENCY_SUFFIX_WORDS = new Set(['grc', 'smc'])
