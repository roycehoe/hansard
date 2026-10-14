import { SearchSort } from '@/constants/search/enums'

export const SEARCH_SORT_DROPDOWN_OPTIONS = [
  { value: SearchSort.RELEVANCE, label: 'Relevance' },
  { value: SearchSort.DATE, label: 'Newest first' },
]

export const PERSON_PICKER_MIN_NAME_LENGTH = 2

export const PERSON_PICKER_MAX_OPTIONS = 20

export const PERSON_PICKER_DEBOUNCE_MS = 250

export const SNIPPET_MARK_START = '<mark>'

export const SNIPPET_MARK_END = '</mark>'

export const SPEECH_MATCHES_HEADING = 'Speech matches'

export const SPEECHES_HEADING = 'Speeches'

export const TITLE_MATCHES_HEADING = 'Title matches'

export const REPORTS_HEADING = 'Reports'

export const SORT_NEWEST_ONLY_DROPDOWN_OPTIONS = [
  { value: SearchSort.DATE, label: 'Newest first' },
]

export const EMPTY_WORDS_DESCRIPTION =
  'Nothing matches these words. Common words such as "the" are ignored. Try different words or a wider date range.'

export const EMPTY_FILTERS_DESCRIPTION =
  'Nothing matches these filters. Try a wider date range or another Parliament.'

export const VISIBLE_SPEECH_MATCHES_PER_REPORT = 3
