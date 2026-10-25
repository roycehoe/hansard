import { SearchSort } from '@/constants/search/enums'

export const SEARCH_SORT_DROPDOWN_OPTIONS = [
  { value: SearchSort.RELEVANCE, label: 'Relevance' },
  { value: SearchSort.DATE, label: 'Newest first' },
  { value: SearchSort.OLDEST, label: 'Oldest first' },
]

export const SEARCH_FORM_ID = 'search-form'

export const SEARCH_WORDS_MAX_LENGTH = 200

export const SEARCH_WORDS_TOO_LONG_ERROR = `Use ${SEARCH_WORDS_MAX_LENGTH} characters or fewer.`

export const SEARCH_WORDS_TOO_LONG_NOTICE = `Search words are limited to ${SEARCH_WORDS_MAX_LENGTH} characters. Shorten them and search again.`

export const SEARCH_TIPS_TEXT = `Put a word in quotes to find only that form, so "housing" leaves out house. Several words in quotes are found together, in that order. Without quotes, searches also match other forms of a word. OR finds either word, and a minus sign leaves a word out. Up to ${SEARCH_WORDS_MAX_LENGTH} characters.`

export const CONSTITUENCY_HINT_TEXT = 'Boundaries change between elections.'

export const FIELD_HINT_CLOSE_DELAY_MS = 150

export const SNIPPET_MARK_START = '<mark>'

export const SNIPPET_MARK_END = '</mark>'

export const SPEECH_MATCHES_HEADING = 'Speech matches'

export const SPEECHES_HEADING = 'Speeches'

export const TITLE_MATCHES_HEADING = 'Title matches'

export const REPORTS_HEADING = 'Reports'

export const SEARCH_SORT_WITHOUT_WORDS_DROPDOWN_OPTIONS = [
  { value: SearchSort.DATE, label: 'Newest first' },
  { value: SearchSort.OLDEST, label: 'Oldest first' },
]

export const EMPTY_WORDS_DESCRIPTION =
  'Common words such as "the" are ignored. Try different words or a wider date range.'

export const EMPTY_FILTERS_DESCRIPTION =
  'Try a wider date range or another Parliament.'

export const VISIBLE_SPEECH_MATCHES_PER_REPORT = 3

export const SEARCH_WORDS_INPUT_ID = 'search-q'

export const CLEAR_FILTERS_LABEL = 'Clear filters'

export const SEARCH_TIMED_OUT_ERROR_CODE = 'search.timed_out'
export const SEARCH_EXCLUDED_WORDS_ONLY_ERROR_CODE =
  'search.excluded_words_only'
export const SEARCH_CONSTITUENCY_NOT_FOUND_ERROR_CODE =
  'search.constituency_not_found'

export const PROXY_ORIGINAL_STATUS_HEADER = 'x-do-orig-status'
