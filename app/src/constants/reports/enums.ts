export enum ReportType {
  ORAL_ANSWER = 'oral-answer',
  WRITTEN_ANSWER = 'written-answer',
  WRITTEN_ANSWER_NA = 'written-answer-na',
  CLARIFICATION = 'clarification',
  MOTION = 'motion',
  MATTER_ADJ = 'matter-adj',
  BILL = 'bill',
  BILL_INTRO = 'bill-intro',
  MINISTERIAL_STATEMENT = 'ministerial-statement',
  WRITTEN_STATEMENT = 'written-statement',
  BUDGET = 'budget',
  SPEAKER = 'speaker',
  DEPUTY_SPEAKER = 'deputy-speaker',
  PERSONAL_EXPLANATION = 'personal-explanation',
  POINT_OF_ORDER = 'point-of-order',
  TRIBUTE = 'tribute',
  PRESIDENT_ADDRESS = 'president-address',
  PETITION = 'petition',
  ADMIN_OATHS = 'admin-oaths',
  OBITUARY_SPEECH = 'obituary-speech',
  YANG_DI_MESSAGE = 'yang-di-message',
  MISC = 'misc',
  ATBP = 'atbp',
}

export enum TranscriptSegmentKind {
  TEXT = 'text',
  BOLD = 'bold',
  ITALIC = 'italic',
}

export enum SpeechKind {
  SPEECH = 'SPEECH',
  PROCEDURAL = 'PROCEDURAL',
  CHAMBER_EVENT = 'CHAMBER_EVENT',
  EDITORIAL_NOTE = 'EDITORIAL_NOTE',
  DOCUMENT_TEXT = 'DOCUMENT_TEXT',
  HEADING = 'HEADING',
  UNCLASSIFIED = 'UNCLASSIFIED',
}
