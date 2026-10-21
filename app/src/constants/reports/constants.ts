import { ReportType } from '@/constants/reports/enums'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.ORAL_ANSWER]: 'Oral answer',
  [ReportType.WRITTEN_ANSWER]: 'Written answer',
  [ReportType.WRITTEN_ANSWER_NA]: 'Written answer to oral question',
  [ReportType.CLARIFICATION]: 'Clarification',
  [ReportType.MOTION]: 'Motion',
  [ReportType.MATTER_ADJ]: 'Adjournment matter',
  [ReportType.BILL]: 'Bill',
  [ReportType.BILL_INTRO]: 'Bill introduction',
  [ReportType.MINISTERIAL_STATEMENT]: 'Ministerial statement',
  [ReportType.WRITTEN_STATEMENT]: 'Written statement',
  [ReportType.BUDGET]: 'Budget',
  [ReportType.SPEAKER]: "Presiding officer's statement",
  [ReportType.DEPUTY_SPEAKER]: "Deputy Speaker's statement",
  [ReportType.PERSONAL_EXPLANATION]: 'Personal explanation',
  [ReportType.POINT_OF_ORDER]: 'Point of order',
  [ReportType.TRIBUTE]: 'Tribute',
  [ReportType.PRESIDENT_ADDRESS]: "President's address",
  [ReportType.PETITION]: 'Petition',
  [ReportType.ADMIN_OATHS]: 'Administration of oaths',
  [ReportType.OBITUARY_SPEECH]: 'Obituary speech',
  [ReportType.YANG_DI_MESSAGE]: 'Message from the Yang di-Pertuan Negara',
  [ReportType.MISC]: 'Miscellaneous',
  [ReportType.ATBP]: 'Assent to bills passed',
}

export const REPORT_TYPE_DESCRIPTIONS: Record<ReportType, string> = {
  [ReportType.ORAL_ANSWER]:
    "A member's question asked in the House and answered aloud by a minister during Question Time.",
  [ReportType.WRITTEN_ANSWER]:
    "A question the member filed for a written reply, with the minister's reply.",
  [ReportType.WRITTEN_ANSWER_NA]:
    "A question for Question Time that the House didn't reach before time ran out, so the minister replied in writing.",
  [ReportType.CLARIFICATION]:
    'A spoken correction or addition to something said earlier.',
  [ReportType.MOTION]:
    'A proposal put to the House for debate and a decision, including motions to adjourn.',
  [ReportType.MATTER_ADJ]:
    'A short debate a member raises at the end of a sitting, on the motion to adjourn.',
  [ReportType.BILL]: "A bill's first, second or third reading.",
  [ReportType.BILL_INTRO]: 'Notice that a bill was introduced.',
  [ReportType.MINISTERIAL_STATEMENT]:
    'A statement a minister makes to the House, not in answer to a question.',
  [ReportType.WRITTEN_STATEMENT]:
    "A written correction to something an office holder said earlier, circulated with the presiding officer's leave.",
  [ReportType.BUDGET]:
    "The Budget debate and the Committee of Supply, where the House debates each ministry's spending.",
  [ReportType.SPEAKER]: 'A statement or ruling by the presiding officer.',
  [ReportType.DEPUTY_SPEAKER]: 'A statement by the Deputy Speaker.',
  [ReportType.PERSONAL_EXPLANATION]:
    "A member, with the presiding officer's leave, explaining or correcting something that concerns them.",
  [ReportType.POINT_OF_ORDER]:
    'A member asking the presiding officer to rule on whether the House is following its rules.',
  [ReportType.TRIBUTE]: 'A tribute to a member or a public figure.',
  [ReportType.PRESIDENT_ADDRESS]:
    "The President's address at the opening of a session, the debate on it, and each ministry's addendum setting out its plans.",
  [ReportType.PETITION]: 'A petition presented to the House.',
  [ReportType.ADMIN_OATHS]:
    'Members taking the Oath of Allegiance or making the Affirmation of Allegiance.',
  [ReportType.OBITUARY_SPEECH]:
    'Speeches marking the death of a member or a public figure.',
  [ReportType.YANG_DI_MESSAGE]:
    "A message from Singapore's head of state between 1959 and 1965.",
  [ReportType.MISC]: 'Records that fit no other type.',
  [ReportType.ATBP]:
    'The record that the head of state assented to bills the House passed.',
}

export const REPORT_TYPE_GROUPS: {
  heading: string
  reportTypes: ReportType[]
}[] = [
  {
    heading: 'Questions',
    reportTypes: [
      ReportType.ORAL_ANSWER,
      ReportType.WRITTEN_ANSWER,
      ReportType.WRITTEN_ANSWER_NA,
    ],
  },
  {
    heading: 'Bills and money',
    reportTypes: [
      ReportType.BILL,
      ReportType.BILL_INTRO,
      ReportType.ATBP,
      ReportType.BUDGET,
    ],
  },
  {
    heading: 'Statements',
    reportTypes: [
      ReportType.MINISTERIAL_STATEMENT,
      ReportType.CLARIFICATION,
      ReportType.WRITTEN_STATEMENT,
      ReportType.PERSONAL_EXPLANATION,
      ReportType.SPEAKER,
      ReportType.DEPUTY_SPEAKER,
    ],
  },
  {
    heading: 'Proceedings and occasions',
    reportTypes: [
      ReportType.MOTION,
      ReportType.MATTER_ADJ,
      ReportType.POINT_OF_ORDER,
      ReportType.PETITION,
      ReportType.PRESIDENT_ADDRESS,
      ReportType.YANG_DI_MESSAGE,
      ReportType.ADMIN_OATHS,
      ReportType.TRIBUTE,
      ReportType.OBITUARY_SPEECH,
      ReportType.MISC,
    ],
  },
]

export const TEXTLESS_ASSENT_FIRST_SITTING = '2012-09-10'

export const REPORT_TYPES_LINK_LABEL = 'What the types mean'

export const REPORT_TYPE_DROPDOWN_OPTIONS = Object.values(ReportType).map(
  (value) => ({ value, label: REPORT_TYPE_LABELS[value] })
)

export const HIGHLIGHT_STOP_WORDS: ReadonlySet<string> = new Set([
  'i',
  'me',
  'my',
  'myself',
  'we',
  'our',
  'ours',
  'ourselves',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
  'he',
  'him',
  'his',
  'himself',
  'she',
  'her',
  'hers',
  'herself',
  'it',
  'its',
  'itself',
  'they',
  'them',
  'their',
  'theirs',
  'themselves',
  'what',
  'which',
  'who',
  'whom',
  'this',
  'that',
  'these',
  'those',
  'am',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'having',
  'do',
  'does',
  'did',
  'doing',
  'a',
  'an',
  'the',
  'and',
  'but',
  'if',
  'or',
  'because',
  'as',
  'until',
  'while',
  'of',
  'at',
  'by',
  'for',
  'with',
  'about',
  'against',
  'between',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'to',
  'from',
  'up',
  'down',
  'in',
  'out',
  'on',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'any',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  's',
  't',
  'can',
  'will',
  'just',
  'don',
  'should',
  'now',
])

export const SPEAKER_NOT_RECORDED_LABEL = 'Speaker not recorded'

export const INFERRED_CREDIT_CLOSE_DELAY_MS = 150
export const INFERRED_CREDIT_METHOD_TEXT =
  'The archive credits the person who held that role at the time. It works this out from the dates each person held the office, or from where the record of the sitting names who held it.'
export const INFERRED_CREDIT_CAVEAT_TEXT =
  'If the role changed hands and the record does not say so, this credit can be wrong.'

export const SPEECH_ANCHOR_MAX_LENGTH = 200
export const SPEECH_LINK_NOTICE_ID = 'speech-link-notice'
export const SPEECH_LINK_MOVED_NOTICE = 'This paragraph moved after an update.'
export const SPEECH_LINK_MISSING_NOTICE =
  'The paragraph this link pointed to is no longer in this report.'

export const LOST_CHARACTER = '�'

export const LOST_CHARACTER_DEFINITION =
  "Parliament's copy of this text lost a character here, often a fraction such as ½ or ¾. The true character isn't known."
