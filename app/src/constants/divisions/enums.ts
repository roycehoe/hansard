export enum DivisionCountSource {
  PRINTED_LINE = 'PRINTED_LINE',
  SPOKEN_TOTAL = 'SPOKEN_TOTAL',
  MINUTES = 'MINUTES',
}

export enum DivisionListStatus {
  NOT_PRINTED = 'NOT_PRINTED',
  STORED = 'STORED',
  COUNTS_DISAGREE = 'COUNTS_DISAGREE',
  LAYOUT_UNREADABLE = 'LAYOUT_UNREADABLE',
}

export enum DivisionVoteListSource {
  MINUTES = 'MINUTES',
  HANSARD = 'HANSARD',
}

export enum DivisionVoteChoice {
  AYE = 'AYE',
  NO = 'NO',
  ABSTAIN = 'ABSTAIN',
  ABSENT = 'ABSENT',
  PAIRED = 'PAIRED',
}

export enum MinutesDivisionPairing {
  PAIRED = 'PAIRED',
  NO_MATCHING_DIVISION = 'NO_MATCHING_DIVISION',
  UNEQUAL_NUMBER = 'UNEQUAL_NUMBER',
  TIED = 'TIED',
  ABSTENTIONS_DIFFER = 'ABSTENTIONS_DIFFER',
}
