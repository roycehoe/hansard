import {
  LEGISLATIVE_ASSEMBLY_LABEL,
  LEGISLATIVE_ASSEMBLY_PARLIAMENT_NUMBER,
  NUMBER_LOCALE,
} from '@/constants/constants'

export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const COVERAGE_LAST_UPDATED = '2026-10-14'

export const METHODS_LAST_REVISED = '2026-10-17'

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

export const PARAGRAPH_DEFINITION =
  'One paragraph of a report as the Official Report prints it. A speech is one or more paragraphs by one person. A report with one speaker and no printed name is kept as a single paragraph, and each line of a table is a paragraph of its own. Some paragraphs are procedural lines, notes or events in the chamber, with no speaker.'

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
    handCheckDate: null,
  },
  {
    parliament: 'Parliament 13',
    years: '2016 to 2020',
    namedLinked: '98.18%',
    allLinked: '96.31%',
    textShare: '99.06%',
    handCheckDate: null,
  },
  {
    parliament: 'Parliament 14',
    years: '2020 to 2025',
    namedLinked: '99.02%',
    allLinked: '97.61%',
    textShare: '99.13%',
    handCheckDate: null,
  },
] as const

export const ATTRIBUTION_FIGURES = [
  {
    label: 'Paragraphs with a speaker label credited to a named person',
    question:
      "Of the paragraphs that print a speaker's name, how many are credited to a person?",
    value: ATTRIBUTION_BY_PARLIAMENT[0].namedLinked,
  },
  {
    label: 'All paragraphs credited to a named person',
    question:
      'Of all paragraphs, procedural lines included, how many are credited to a person?',
    value: ATTRIBUTION_BY_PARLIAMENT[0].allLinked,
  },
  {
    label: 'Share of the text in a credited paragraph',
    question: 'How much of the text sits in a paragraph credited to a person?',
    value: ATTRIBUTION_BY_PARLIAMENT[0].textShare,
  },
] as const

export const ATTRIBUTION_MEASUREMENTS = [
  `Paragraphs with a speaker label: ${LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of ${SPEECH_WITH_SPEAKER_LABEL_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs with a speaker label, leaving out collective "hon. Member" references and stage directions.`,
  `All paragraphs: ${LINKED_SPEECH_COUNT.toLocaleString(NUMBER_LOCALE)} of ${SPEECH_ROW_COUNT.toLocaleString(NUMBER_LOCALE)} paragraphs, counting those with no speaker label.`,
  'Text share: characters of text in a paragraph credited to a named person, out of all the text in reports, including reports with no paragraphs.',
  'Parliament 12 counts the whole Parliament, before and after 10 September 2012.',
] as const

export const COUNT_DEFINITIONS = [
  {
    term: 'Report',
    definition:
      'One item of business in a sitting, such as an oral answer, a bill reading or a motion.',
  },
  {
    term: 'Sitting',
    definition: 'One day the House met.',
  },
  {
    term: 'Paragraph',
    definition: PARAGRAPH_DEFINITION,
  },
  {
    term: 'Membership',
    definition: `One person's seat in one Parliament. The count also includes ${NON_MEMBER_MEMBERSHIP_COUNT} entries for Governors and Presidents, who were not members.`,
  },
  {
    term: 'People',
    definition: `Each person counted once across every Parliament, including ${NON_MEMBER_PERSON_COUNT} Governors and Presidents who were never members.`,
  },
  {
    term: 'Attendance record',
    definition: "One entry in a sitting's attendance list.",
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
      'A member who sat in both the Legislative Assembly (1955 to 1965) and Parliament 1 has one membership, listed as Parliament 1.',
      'Party is recorded per membership, as on the ballot at the election that seated the member. A Nominated Member\'s party field holds the seat type, and one Speaker\'s holds "NA".',
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
