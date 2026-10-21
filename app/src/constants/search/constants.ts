import { SearchSort } from '@/constants/search/enums'

export const SEARCH_SORT_DROPDOWN_OPTIONS = [
  { value: SearchSort.RELEVANCE, label: 'Relevance' },
  { value: SearchSort.DATE, label: 'Newest first' },
  { value: SearchSort.OLDEST, label: 'Oldest first' },
]

export const PHONE_MEDIA_QUERY = '(width < 32rem)'

export const SEARCH_FORM_ID = 'search-form'

export const SEARCH_WORDS_MAX_LENGTH = 200

export const SEARCH_WORDS_TOO_LONG_ERROR = `Use ${SEARCH_WORDS_MAX_LENGTH} characters or fewer.`

export const SEARCH_WORDS_TOO_LONG_NOTICE = `Search words are limited to ${SEARCH_WORDS_MAX_LENGTH} characters. Shorten them and search again.`

export const SEARCH_TIPS_TEXT = `Use quotes for an exact phrase, OR for either word, and a minus sign to leave a word out. Up to ${SEARCH_WORDS_MAX_LENGTH} characters.`

export const PERSON_PICKER_MIN_NAME_LENGTH = 2

export const PERSON_PICKER_MAX_OPTIONS = 20

export const SEARCH_TIPS_CLOSE_DELAY_MS = 150
export const PERSON_PICKER_DEBOUNCE_MS = 250

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

export const PROXY_ORIGINAL_STATUS_HEADER = 'x-do-orig-status'
