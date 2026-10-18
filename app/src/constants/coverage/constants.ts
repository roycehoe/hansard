import { LEGISLATIVE_ASSEMBLY_LABEL } from '@/constants/constants'

export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const COVERAGE_LAST_UPDATED = '2026-10-14'

export const METHODS_LAST_REVISED = '2026-10-18'

export const ATTRIBUTION_MEASURED_ON = '2026-10-14'

export const HAND_CHECK_DATE = '2026-10-17'

export const HAND_CHECK_LINKED_SPEECH_COUNT = 406

export const HAND_CHECK_CORRECT_SPEECH_COUNT = 404

export const HAND_CHECK_PROCEDURAL_SPEECH_COUNT = 2

export const UNLINKED_HAND_CHECK_DATE = '2026-10-13'

export const HAND_CHECK_UNLINKED_SPEECH_COUNT = 20

export const REPAIR_DATE = '2026-10-14'

export const REPAIR_PROCEDURAL_LINE_COUNT = 12_245

export const LINKED_SPEECH_COUNT = 554_900

export const SPEECH_WITH_SPEAKER_LABEL_COUNT = 567_756

export const SPEECH_ROW_COUNT = 624_332

export const NON_MEMBER_PERSON_COUNT = 6

export const NON_MEMBER_MEMBERSHIP_COUNT = 20

export const NO_TEXT_BY_DESIGN_REPORT_COUNT = 106

export const LEGISLATIVE_ASSEMBLY_LAST_SITTING = '1965-06-16'

export const PARLIAMENT_ONE_FIRST_SITTING = '1965-12-08'

export const CHANGEOVER_YEAR = 1965

export const PARLIAMENT_FOURTEEN_LAST_SITTING = '2025-04-08'

export const PARLIAMENT_FOURTEEN_DISSOLVED = '2025-04-15'

export const PARLIAMENT_FIFTEEN_FIRST_SITTING = '2025-09-05'

export const SOURCE_CODE_URL = 'https://github.com/roycehoe/hansard'

export const ATTRIBUTION_BY_PARLIAMENT = [
  {
    parliament: `${LEGISLATIVE_ASSEMBLY_LABEL} to Parliament 11`,
    years: '1955 to 2011',
    namedLinked: '97.74%',
    allLinked: '88.88%',
    textShare: '96.58%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 12',
    years: '2011 to 2015',
    namedLinked: '98.94%',
    allLinked: '96.93%',
    textShare: '98.71%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 13',
    years: '2016 to 2020',
    namedLinked: '98.18%',
    allLinked: '96.31%',
    textShare: '99.06%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 14',
    years: '2020 to 2025',
    namedLinked: '99.02%',
    allLinked: '97.61%',
    textShare: '99.13%',
    handCheckDate: HAND_CHECK_DATE,
  },
] as const
