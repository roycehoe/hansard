export const LATEST_MEMBERSHIP_PARLIAMENT_NUMBER = 15

export const MEMBERSHIP_PARLIAMENT_NUMBERS = Array.from(
  { length: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER + 1 },
  (_, parliamentNumber) => parliamentNumber
)

// The scraper stores some GRCs with the suffix and some without, so a typed
// "GRC" or "SMC" would hide every constituency stored without it.
export const CONSTITUENCY_SUFFIX_WORDS = new Set(['grc', 'smc'])
