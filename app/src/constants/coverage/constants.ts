export const COVERAGE_STALE_TIME_MILLISECONDS = 60 * 60 * 1000

export const ATTRIBUTION_MEASURED_ON = '2026-10-13'

export const ATTRIBUTION_SCOPE =
  'Parliaments 0 to 11 (the Legislative Assembly to 2011)'

export const ATTRIBUTION_FIGURES = [
  {
    label: 'Speeches with a name that are linked to a person',
    value: '97.61%',
    detail:
      '564,509 of 578,359 speech rows with a speaker name, leaving out collective "hon. Member" references and stage directions.',
  },
  {
    label: 'All speeches that are linked to a person',
    value: '90.42%',
    detail:
      '564,509 of 624,332 speech rows, counting rows with no speaker name at all.',
  },
  {
    label: 'Share of the text that sits under a linked speech',
    value: '96.81%',
    detail:
      'Characters of body text in a linked speech, out of every report with text, including reports that produced no speech rows.',
  },
] as const

export const KNOWN_GAPS = [
  'No report text from 10 September 2012 onward. Reports from then on have their title and details only.',
  'Parliament 15 is not in the archive.',
  'No attendance lists after 13 August 2012.',
  'Memberships of the Legislative Assembly (1955 to 1965) are filed under Parliament 1, so a person page counts Assembly speeches and attendance under the Legislative Assembly heading but lists the membership as Parliament 1.',
  'About 1,700 reports fetched in October 2026 carry a position number that restarts each month, so their order within a sitting can be wrong.',
  'Column numbers are not shown yet. Citations omit the column until the archive has it.',
  "A person's page address can change when the archive corrects who is who. Report and sitting addresses do not change.",
  'Links to individual speeches (#s1, #s2 and so on) are best-effort. A re-parse can renumber the speeches in a report.',
  'Party names are shown exactly as stored, including two spellings of People\'s Action Party and placeholder values such as "Unknown".',
  'Some budget and President\'s address titles show garbled characters such as "â€™".',
  'Speeches labelled "The Chairman" cannot be linked to a person, because the report does not name the chair.',
] as const
