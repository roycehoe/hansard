export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const ATTRIBUTION_MEASURED_ON = '2026-10-14'

export const ATTRIBUTION_SCOPE =
  'Parliaments 0 to 11 (the Legislative Assembly to 2011)'

export const ATTRIBUTION_BY_PARLIAMENT = [
  {
    parliament: '0 to 11',
    namedLinked: '97.74%',
    allLinked: '88.88%',
    textShare: '96.58%',
  },
  {
    parliament: '12',
    namedLinked: '98.94%',
    allLinked: '96.93%',
    textShare: '98.71%',
  },
  {
    parliament: '13',
    namedLinked: '98.18%',
    allLinked: '96.31%',
    textShare: '99.06%',
  },
  {
    parliament: '14',
    namedLinked: '99.02%',
    allLinked: '97.61%',
    textShare: '99.13%',
  },
] as const

export const ATTRIBUTION_FIGURES = [
  {
    label: 'Speeches with a speaker label that are linked to a person',
    value: ATTRIBUTION_BY_PARLIAMENT[0].namedLinked,
    detail:
      '554,901 of 567,756 speech rows with a speaker label, leaving out collective "hon. Member" references and stage directions.',
  },
  {
    label: 'All speeches that are linked to a person',
    value: ATTRIBUTION_BY_PARLIAMENT[0].allLinked,
    detail:
      '554,901 of 624,332 speech rows, counting rows with no speaker label at all.',
  },
  {
    label: 'Share of the text that sits under a linked speech',
    value: ATTRIBUTION_BY_PARLIAMENT[0].textShare,
    detail:
      'Characters of body text in a linked speech, out of every report with text, including reports that produced no speech rows.',
  },
] as const

export const KNOWN_GAPS = [
  'Parliament 15 is not in the archive.',
  'Memberships of the Legislative Assembly (1955 to 1965) are filed under Parliament 1, so a person page counts Assembly speeches and attendance under the Legislative Assembly heading but lists the membership as Parliament 1.',
  'About 1,800 reports added in October 2026 carry a position number that restarts each month, so their order within 403 sittings before 10 September 2012 can be wrong.',
  'In 40 sittings from 16 August 2016 to 8 April 2025, 195 reports share a position number with another report in the same sitting, so their order within the sitting is undefined.',
  'Column numbers are not shown yet. Citations omit the column until the archive has it.',
  "A person's page address can change when the archive corrects who is who. Report and sitting addresses do not change.",
  'A link to one speech (#s12) can point to a different speech after the archive is rebuilt.',
  'Party names are shown exactly as the source gives them, including two spellings of People\'s Action Party and placeholder values such as "Unknown".',
  'Some budget and President\'s address titles show garbled characters such as "â€™".',
  'Speeches labelled "The Chairman" cannot be linked to a person, because the report does not name the chair.',
] as const
