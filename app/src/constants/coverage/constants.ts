import { SCRAPER_SOURCE_CODE_URL, SOURCE_CODE_URL } from '@/constants/constants'

export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const METHODS_LAST_REVISED = '2026-11-15'

export const METHODS_TERMS_SECTION_ID = 'terms'

export const METHODS_ATTRIBUTION_HEADING_ID = 'attribution-heading'

export const METHODS_ANNEX_SECTION_ID = 'annex'

export const HAND_CHECK_JUDGED_BY_ROYCE_SPEECH_COUNT = 3

export const HAND_CHECK_WRONG_CREDIT_SPEECH_COUNT = 1

export const ERROR_SHARE_TO_PARLIAMENT_ELEVEN = '0.07%'

export const ERROR_SHARE_PARLIAMENTS_TWELVE_TO_FOURTEEN = '0.02%'

export const LEGISLATIVE_ASSEMBLY_LAST_SITTING = '1965-06-16'

export const PARLIAMENT_ONE_FIRST_SITTING = '1965-12-08'

export const CHANGEOVER_YEAR = 1965

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
