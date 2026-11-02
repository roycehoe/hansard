import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
  SCRAPER_SOURCE_CODE_URL,
  SOURCE_CODE_URL,
} from '@/constants/constants'

export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const METHODS_LAST_REVISED = '2026-11-02'

export const METHODS_TERMS_SECTION_ID = 'terms'

export const METHODS_PRIVACY_SECTION_ID = 'privacy'

export const METHODS_ATTRIBUTION_HEADING_ID = 'attribution-heading'

export const ATTRIBUTION_MEASURED_ON = '2026-10-19'

export const HAND_CHECK_DATE = '2026-11-02'

export const HAND_CHECK_SPEECH_COUNT = 1_000

export const HAND_CHECK_LIVE_CHECKED_REPORT_COUNT = 50

export const HAND_CHECK_LIVE_MATCHED_REPORT_COUNT = 50

export const HAND_CHECK_FLAGGED_SPEECH_COUNT = 12

export const HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT = 3

export const HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT = 1

export const HAND_CHECK_STRAY_MARK_SPEECH_COUNT = 6

export const HAND_CHECK_PLANTED_ERROR_COUNT = 30

export const HAND_CHECK_CATCH_RATE_LOWER_BOUND = '90.5%'

export const HAND_CHECK_WRONG_CREDIT_BOUND = '0.47%'

export const HAND_CHECK_WORD_ERROR_BOUND = '0.30%'

export const HAND_CHECK_ANY_ERROR_BOUND = '1.31%'

export const HAND_CHECK_OLDER_SYSTEM_SPEECH_COUNT = 532

export const HAND_CHECK_OLDER_SYSTEM_WRONG_CREDIT_SPEECH_COUNT = 1

export const HAND_CHECK_OLDER_SYSTEM_WRONG_CREDIT_BOUND = '0.89%'

export const HAND_CHECK_NEWER_SYSTEM_SPEECH_COUNT = 468

export const HAND_CHECK_NEWER_SYSTEM_WRONG_CREDIT_SPEECH_COUNT = 0

export const HAND_CHECK_NEWER_SYSTEM_WRONG_CREDIT_BOUND = '0.64%'

export const ERROR_CHECK_DATE = '2026-10-20'

export const ERROR_CHECK_SPEECH_COUNT = 24_649

export const ERROR_SHARE_TO_PARLIAMENT_ELEVEN = '0.07%'

export const ERROR_SHARE_TO_PARLIAMENT_ELEVEN_BOUND = '0.12%'

export const ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN = '0.02%'

export const ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN_BOUND = '0.04%'

export const ERROR_CHECK_PARLIAMENT_FIFTEEN_SPEECH_COUNT = 5_754

export const ERROR_SHARE_PARLIAMENT_FIFTEEN_BOUND = '0.1%'

export const ACCESSIBILITY_CHECK_DATE = '2026-11-01'

export const LEGISLATIVE_ASSEMBLY_LAST_SITTING = '1965-06-16'

export const PARLIAMENT_ONE_FIRST_SITTING = '1965-12-08'

export const CHANGEOVER_YEAR = 1965

export const PARLIAMENT_FOURTEEN_LAST_SITTING = '2025-04-08'

export const PARLIAMENT_FOURTEEN_DISSOLVED = '2025-04-15'

export const PARLIAMENT_FIFTEEN_FIRST_SITTING = '2025-09-05'

export const LINK_CHECK_REPORT_URL = `${SCRAPER_SOURCE_CODE_URL}/blob/master/docs/report/link-check-2026-10-19.md`

export const HAND_CHECK_REPORT_URL = `${SCRAPER_SOURCE_CODE_URL}/blob/master/docs/report/hand-check-2-2026-11-02.md`

export const FIRST_HAND_CHECK_REPORT_URL = `${SCRAPER_SOURCE_CODE_URL}/blob/master/docs/report/hand-check-2026-11-02.md`

export const SCRAPER_REPORTS_URL = `${SCRAPER_SOURCE_CODE_URL}/tree/master/docs/report`

export const DATA_LOSS_REGISTER_URL = `${SCRAPER_SOURCE_CODE_URL}/blob/master/docs/data-loss-register.md`

export const HOW_THIS_WAS_BUILT_URL = `${SOURCE_CODE_URL}/blob/master/docs/how-this-was-built.md`

export const CORRECTIONS_LOG_URL = `${SOURCE_CODE_URL}/blob/master/docs/corrections.md`

export const ORIENTATION_PARAGRAPHS = [
  {
    language: 'zh',
    text: '本站是新加坡国会辩论（1955年起）的非官方存档，只有英文版。内容取自国会网站上的 Official Report，可能与原文有出入。引用前应先核对 Official Report。',
  },
  {
    language: 'ms',
    text: 'Laman ini ialah arkib tidak rasmi perbahasan Parlimen Singapura sejak 1955. Laman ini hanya dalam bahasa Inggeris. Teks disalin daripada Official Report di laman web Parlimen dan mungkin berbeza daripadanya. Semak Official Report sebelum memetik teks ini.',
  },
  {
    language: 'ta',
    text: 'இந்தத் தளம் 1955 முதல் சிங்கப்பூர் நாடாளுமன்ற விவாதங்களின் அதிகாரப்பூர்வமற்ற காப்பகம். தளம் ஆங்கிலத்தில் மட்டுமே உள்ளது. உரை நாடாளுமன்ற இணையதளத்தில் உள்ள Official Report-இலிருந்து நகலெடுக்கப்பட்டது, அதிலிருந்து வேறுபடலாம். மேற்கோள் காட்டுவதற்கு முன் Official Report-ஐச் சரிபார்க்கவும்.',
  },
] as const

export const TAKEDOWN_DEADLINE_WORKING_DAYS = 2

export const ATTRIBUTION_BY_PARLIAMENT = [
  {
    parliament: `${LEGISLATIVE_ASSEMBLY_LABEL} to Parliament 11`,
    firstParliamentNumber: LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
    lastParliamentNumber: 11,
    years: '1955 to 2011',
    namedLinked: '98.12%',
    allLinked: '84.20%',
    textShare: '97.16%',
  },
  {
    parliament: 'Parliament 12',
    firstParliamentNumber: 12,
    lastParliamentNumber: 12,
    years: '2011 to 2015',
    namedLinked: '99.28%',
    allLinked: '95.10%',
    textShare: '98.69%',
  },
  {
    parliament: 'Parliament 13',
    firstParliamentNumber: 13,
    lastParliamentNumber: 13,
    years: '2016 to 2020',
    namedLinked: '98.91%',
    allLinked: '95.30%',
    textShare: '98.88%',
  },
  {
    parliament: 'Parliament 14',
    firstParliamentNumber: 14,
    lastParliamentNumber: 14,
    years: '2020 to 2025',
    namedLinked: '99.31%',
    allLinked: '96.42%',
    textShare: '98.97%',
  },
  {
    parliament: 'Parliament 15',
    firstParliamentNumber: 15,
    lastParliamentNumber: 15,
    years: 'From 2025',
    namedLinked: '99.61%',
    allLinked: '97.09%',
    textShare: '99.24%',
  },
] as const
