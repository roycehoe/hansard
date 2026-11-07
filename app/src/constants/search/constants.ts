import { SearchSort } from '@/constants/search/enums'

export const SEARCH_SORT_DROPDOWN_OPTIONS = [
  { value: SearchSort.RELEVANCE, label: 'Relevance' },
  { value: SearchSort.DATE, label: 'Newest first' },
  { value: SearchSort.OLDEST, label: 'Oldest first' },
]

export const SEARCH_FORM_ID = 'search-form'

export const SEARCH_WORDS_MAX_LENGTH = 256

export const FIRST_SITTING_DATE = '1955-04-22'

export const SEARCH_DATE_OUT_OF_RANGE_ERROR =
  'Use a date from 22 April 1955 to today.'

export const SEARCH_WORDS_TOO_LONG_ERROR = `Use ${SEARCH_WORDS_MAX_LENGTH} characters or fewer.`

export const SEARCH_WORDS_TOO_LONG_NOTICE = `Search words are limited to ${SEARCH_WORDS_MAX_LENGTH} characters. Shorten them and search again.`

export const SEARCH_HELP_EXAMPLES = [
  { query: 'hawker rent', meaning: 'Both words in the same paragraph' },
  { query: '"carbon tax"', meaning: 'This exact phrase' },
  { query: 'vaping OR vaporiser', meaning: 'Either word' },
  { query: 'hawker -Covid', meaning: 'Leaves out paragraphs with Covid' },
]

export const SEARCH_HELP_FILTERS_TEXT =
  'To search by person or date, use the filters.'

export const SEARCH_WORD_FORMS_NOTE =
  'Words without quotes also match other forms, so housing finds house.'

export const CONSTITUENCY_HINT_TEXT = 'Boundaries change between elections.'

export const NON_PLACE_CONSTITUENCIES = new Set([
  'Acting',
  'Nominated',
  'Nominated Member',
  'Non-Constituency Member',
  'ex-officio',
])

export const SEAT_TYPE_NAMES = new Set([
  'Nominated Member',
  'Non-Constituency Member',
])

export const FIELD_HINT_CLOSE_DELAY_MS = 150

export const SNIPPET_MARK_START = '<mark>'

export const SNIPPET_MARK_END = '</mark>'

export const SPEECH_MATCHES_HEADING = 'Speech matches'

export const SPEECHES_HEADING = 'Speeches'

export const TITLE_MATCHES_HEADING = 'Title matches'

export const REPORTS_HEADING = 'Reports'

export const EMPTY_SPEECH_WORDS_DESCRIPTION =
  'All search terms must appear in the same paragraph. Try using fewer words. Common words like "the" are ignored.'

export const EMPTY_TITLE_WORDS_DESCRIPTION =
  'All search terms must appear in the title. Try using fewer words. Common words like "the" are ignored.'

export const EMPTY_FILTERS_DESCRIPTION =
  'Try a wider date range or another Parliament.'

export const VISIBLE_SPEECH_MATCHES_PER_REPORT = 3

export const SEARCH_WORDS_INPUT_ID = 'search-q'

export const CLEAR_FILTERS_LABEL = 'Clear filters'

export const SEARCH_TIMED_OUT_ERROR_CODE = 'search.timed_out'
export const SEARCH_BUSY_ERROR_CODE = 'search.busy'
export const SEARCH_EXCLUDED_WORDS_ONLY_ERROR_CODE =
  'search.excluded_words_only'
export const SEARCH_CONSTITUENCY_NOT_FOUND_ERROR_CODE =
  'search.constituency_not_found'

export const PROXY_ORIGINAL_STATUS_HEADER = 'x-do-orig-status'
