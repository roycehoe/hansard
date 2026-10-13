import { SearchSort } from '@/constants/search/enums'

export const SEARCH_SORT_DROPDOWN_OPTIONS = [
  { value: SearchSort.RELEVANCE, label: 'Relevance' },
  { value: SearchSort.DATE, label: 'Newest first' },
]

export const SNIPPET_MARK_START = '<mark>'

export const SNIPPET_MARK_END = '</mark>'
