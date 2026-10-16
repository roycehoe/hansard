import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
  NUMBER_LOCALE,
} from '@/constants/constants'

export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const COVERAGE_LAST_UPDATED = '2026-10-14'

export const ATTRIBUTION_MEASURED_ON = '2026-10-14'

export const HAND_CHECK_DATE = '2026-10-13'

export const HAND_CHECK_LINKED_SPEECH_COUNT = 80

export const HAND_CHECK_CORRECT_SPEECH_COUNT = 75

export const HAND_CHECK_PROCEDURAL_SPEECH_COUNT = 5

export const HAND_CHECK_UNLINKED_SPEECH_COUNT = 20

export const REPAIR_DATE = '2026-10-14'

export const REPAIR_PROCEDURAL_LINE_COUNT = 12_245

export const NOT_HAND_CHECKED_LABEL = 'Not hand-checked'

export const LINKED_SPEECH_COUNT = 554_900

export const SPEECH_WITH_SPEAKER_LABEL_COUNT = 567_756

export const SPEECH_ROW_COUNT = 624_332

export const PROCEDURAL_PASSAGE_COUNT = 60_877

export const NON_MEMBER_PERSON_COUNT = 6

export const NON_MEMBER_MEMBERSHIP_COUNT = 20

export const NO_TEXT_BY_DESIGN_REPORT_COUNT = 106

export const LEGISLATIVE_ASSEMBLY_LAST_SITTING = '1965-06-16'

export const PARLIAMENT_ONE_FIRST_SITTING = '1965-12-08'

export const CHANGEOVER_YEAR = 1965

export const CITATION_EXAMPLE_REPORT = {
  sittingDate: '2025-04-08',
  volumeNumber: 95,
  parliamentNumber: 14,
} as const

export const CITATION_EXAMPLE_SPEECH = {
  sittingDate: '1955-04-22',
  volumeNumber: 1,
  parliamentNumber: LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
  speakerLabel: 'The Chief Minister (Mr D. S. Marshall)',
  personName: 'David Marshall',
} as const

export const ATTRIBUTION_BY_PARLIAMENT = [
  {
    parliament: `${LEGISLATIVE_ASSEMBLY_LABEL} to 11`,
    namedLinked: '97.74%',
    allLinked: '88.88%',
    textShare: '96.58%',
    handCheckDate: HAND_CHECK_DATE,
  },
  {
    parliament: '12',
    namedLinked: '98.94%',
    allLinked: '96.93%',
    textShare: '98.71%',
    handCheckDate: null,
  },
  {
    parliament: '13',
    namedLinked: '98.18%',
    allLinked: '96.31%',
    textShare: '99.06%',
    handCheckDate: null,
  },
  {
    parliament: '14',
    namedLinked: '99.02%',
    allLinked: '97.61%',
    textShare: '99.13%',
    handCheckDate: null,
  },
] as const

export const ATTRIBUTION_FIGURES = [
  {
    label: 'Speeches with a speaker label that are linked to a person',
    value: ATTRIBUTION_BY_PARLIAMENT[0].namedLinked,
  },
  {
    label: 'All speeches that are linked to a person',
    value: ATTRIBUTION_BY_PARLIAMENT[0].allLinked,
  },
  {
    label: 'Share of the text in a linked speech',
    value: ATTRIBUTION_BY_PARLIAMENT[0].textShare,
  },
] as const

export const ATTRIBUTION_MEASUREMENTS = [
  `Speeches with a speaker label: ${LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of ${SPEECH_WITH_SPEAKER_LABEL_COUNT.toLocaleString(NUMBER_LOCALE)} speeches with a speaker label, leaving out collective "hon. Member" references and stage directions.`,
  `All speeches: ${LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of ${SPEECH_ROW_COUNT.toLocaleString(NUMBER_LOCALE)} speeches, counting those with no speaker label.`,
  'Text share: characters of text in a linked speech, out of all the text in reports with text, including reports with no speeches.',
  'Parliament 12 counts the whole Parliament, before and after 10 September 2012.',
] as const

export const COUNT_DEFINITIONS = [
  {
    term: 'Report',
    definition:
      'One item of business in a sitting, such as an oral answer, a bill reading or a motion.',
  },
  {
    term: 'Speech passage',
    definition: `One turn by one speaker, which the rest of the site calls a speech. ${PROCEDURAL_PASSAGE_COUNT.toLocaleString(NUMBER_LOCALE)} are procedural lines with no speaker.`,
  },
  {
    term: 'Membership',
    definition: `One person's seat in one Parliament. The count also includes ${NON_MEMBER_MEMBERSHIP_COUNT} entries for Governors and Presidents, who were not members.`,
  },
  {
    term: 'People',
    definition: `Each person counted once across every Parliament, including ${NON_MEMBER_PERSON_COUNT} Governors and Presidents who were never members.`,
  },
] as const

export const KNOWN_GAP_GROUPS = [
  {
    heading: 'What is missing',
    gaps: [
      'Parliament 15 is not in the archive yet.',
      'Column numbers are not in the archive, so copied citations leave them out.',
      'Text that is not part of any speech, such as headings and the lines before the first speaker, is not shown on report pages. It is about 1.2% of the text from before 10 September 2012.',
    ],
  },
  {
    heading: 'Who said what',
    gaps: [
      'About 15,000 speeches are labelled "The Chairman" without a name, so they can\'t be credited to a person.',
      '2,078 reports from before 10 September 2012 have not had the latest speaker fixes applied.',
      'Legislative Assembly memberships (1955 to 1965) are filed under Parliament 1. A person page counts Assembly speeches and attendance under the Legislative Assembly but lists the membership as Parliament 1.',
      'Party names are shown as recorded, including two spellings of People\'s Action Party and placeholder values such as "Unknown".',
    ],
  },
  {
    heading: 'Text and order',
    gaps: [
      'In about 18,000 reports from before 10 September 2012, a word can run into the one before it where the source had a special space character. In about 2,400 of these reports two words merge into one, so a search can miss them.',
      'In 403 sittings before 10 September 2012, about 1,800 reports can be listed out of order within the sitting.',
      'In 40 sittings from 16 August 2016 to 8 April 2025, 195 reports share their place in the order with another report, so their order within the sitting can be wrong.',
      'Some budget and President\'s address titles show garbled characters such as "â€™".',
    ],
  },
  {
    heading: 'Links',
    gaps: [
      "A person's page address can change when the archive corrects who is who. Report and sitting addresses do not change.",
      'A speech link (such as #s12) can lead to a different speech after the archive is rebuilt.',
    ],
  },
] as const
