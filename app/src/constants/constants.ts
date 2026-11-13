export const OFFICIAL_RECORD_SEARCH_URL = 'https://sprs.parl.gov.sg/search/'

export const SOURCE_CODE_URL = 'https://github.com/roycehoe/hansard'

export const SECURITY_POLICY_URL = `${SOURCE_CODE_URL}/blob/master/SECURITY.md`

export const REPORT_ERROR_FORM_URL = `${SOURCE_CODE_URL}/issues/new?template=report-an-error.yml`

export const SCRAPER_SOURCE_CODE_URL =
  'https://github.com/roycehoe/hansard-scraper'

export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? ''

export const RESEARCHERS_FORM_URL =
  import.meta.env.VITE_RESEARCHERS_FORM_URL ?? ''

export const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL ?? ''

export const HTTP_NOT_FOUND = 404

export const HTTP_GONE = 410

export const HTTP_SERVER_ERROR_MIN = 500

export const HTTP_SERVICE_UNAVAILABLE = 503

export const HTTP_GATEWAY_TIMEOUT = 504

export const ENDPOINT_NOT_FOUND_ERROR_CODE = 'endpoint.not_found'

export const NUMBER_LOCALE = 'en-SG'

export const FILTER_ALL = 'all'

export const PHONE_MEDIA_QUERY = '(width < 32rem)'

export const LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER = 0

export const LEGISLATIVE_ASSEMBLY_LABEL = 'Legislative Assembly'

export const TEXT_NOT_IN_ARCHIVE_LABEL = 'Text not in this archive'

export const ABSENCE_DEFINITION =
  "Listed as absent in the sitting's attendance list. An absence can have many causes, including leave and official duties."

export const BACKDATED_DEFINITION =
  'In force from a date before Parliament first read the Bill.'

export const REVISED_EDITION_DEFINITION =
  'A reprint of an Act with every change made up to then folded into one text.'

export const QUESTION_DEFINITION =
  'A question a member puts to a minister, aloud at Question Time or in writing. Ministers answer questions, and the Speaker and Deputy Speakers chair the sitting, so members in those offices ask few or none.'

export const DEFAULT_QUERY_RETRY_COUNT = 3

export const SEARCH_BUSY_RETRY_COUNT = 1

export const SITE_NAME = 'Open Hansard'
export const HOME_DOCUMENT_TITLE =
  'Open Hansard: search Singapore Parliament debates since 1955'
export const REPORT_RECORD_NAME = 'Singapore Hansard'

export const DOCUMENT_TITLE_SEPARATOR = ' · '

export const PAGE_TITLE_CLASS_NAME =
  'font-serif text-2xl font-semibold break-words outline-hidden lg:text-3xl'
