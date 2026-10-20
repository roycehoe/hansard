import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
} from '@/constants/constants'

export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const COVERAGE_LAST_UPDATED = '2026-10-19'

export const METHODS_LAST_REVISED = '2026-10-20'

export const METHODS_TERMS_SECTION_ID = 'terms'

export const ATTRIBUTION_MEASURED_ON = '2026-10-19'

export const HAND_CHECK_DATE = '2026-10-19'

export const NOT_CHECKED_LABEL = 'Not checked'

export const HAND_CHECK_LINKED_SPEECH_COUNT = 464

export const HAND_CHECK_CORRECT_SPEECH_COUNT = 463

export const UNLINKED_HAND_CHECK_DATE = '2026-10-13'

export const HAND_CHECK_UNLINKED_SPEECH_COUNT = 20

export const REPAIR_DATE = '2026-10-14'

export const REPAIR_PROCEDURAL_LINE_COUNT = 12_245

export const LINKED_SPEECH_COUNT = 513_578

export const SPEECH_WITH_SPEAKER_LABEL_COUNT = 523_437

export const SPEECH_ROW_COUNT = 609_933

export const NON_MEMBER_PERSON_COUNT = 6

export const NON_MEMBER_MEMBERSHIP_COUNT = 21

export const NO_TEXT_BY_DESIGN_REPORT_COUNT = 113

export const LEGISLATIVE_ASSEMBLY_LAST_SITTING = '1965-06-16'

export const PARLIAMENT_ONE_FIRST_SITTING = '1965-12-08'

export const CHANGEOVER_YEAR = 1965

export const PARLIAMENT_FOURTEEN_LAST_SITTING = '2025-04-08'

export const PARLIAMENT_FOURTEEN_DISSOLVED = '2025-04-15'

export const PARLIAMENT_FIFTEEN_FIRST_SITTING = '2025-09-05'

export const ATTRIBUTION_BY_PARLIAMENT = [
  {
    parliament: `${LEGISLATIVE_ASSEMBLY_LABEL} to Parliament 11`,
    firstParliamentNumber: LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
    lastParliamentNumber: 11,
    years: '1955 to 2011',
    namedLinked: '98.12%',
    allLinked: '84.20%',
    textShare: '97.16%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 12',
    firstParliamentNumber: 12,
    lastParliamentNumber: 12,
    years: '2011 to 2015',
    namedLinked: '99.28%',
    allLinked: '95.10%',
    textShare: '98.69%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 13',
    firstParliamentNumber: 13,
    lastParliamentNumber: 13,
    years: '2016 to 2020',
    namedLinked: '98.91%',
    allLinked: '95.30%',
    textShare: '98.88%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 14',
    firstParliamentNumber: 14,
    lastParliamentNumber: 14,
    years: '2020 to 2025',
    namedLinked: '99.31%',
    allLinked: '96.42%',
    textShare: '98.97%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: 'Parliament 15',
    firstParliamentNumber: 15,
    lastParliamentNumber: 15,
    years: 'From 2025',
    namedLinked: '99.61%',
    allLinked: '97.09%',
    textShare: '99.24%',
    handCheckDate: HAND_CHECK_DATE,
  },
] as const
