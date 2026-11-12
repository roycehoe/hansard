import type { HandAliasNote } from '@/types/people/interfaces'

export const LATEST_MEMBERSHIP_PARLIAMENT_NUMBER = 15

export const PERSON_TITLE_SUFFIX = 'speeches in Parliament'

export const SPELLING_NOTE_ID = 'spelling-note'

export const SPELLING_NOTE_NUMBER = 1

export const PERSON_REPORT_PREVIEW_ROW_COUNT = 5

export const MEMBER_TIMELINE_HEADING = 'Offices and Bills'

export const MEMBERSHIP_CONTINUED_NOTE =
  'This membership continued into Parliament 1, where it appears in the Memberships table.'

export const OFFICE_DATES_DEFINITION =
  'The first and last sittings whose attendance list prints this office beside the name. They are not the dates of appointment or of leaving office.'

export const MEMBERSHIP_PARLIAMENT_NUMBERS = Array.from(
  { length: LATEST_MEMBERSHIP_PARLIAMENT_NUMBER + 1 },
  (_, parliamentNumber) => parliamentNumber
)

// The scraper stores constituency names without the "GRC" or "SMC" suffix
// that readers often type, so a typed suffix would match nothing.
export const CONSTITUENCY_SUFFIX_WORDS = new Set(['grc', 'smc'])

export const POSTAL_CODE_ENQUIRY_URL =
  'https://app.eservice.eld.gov.sg/voter/postalcodeenquiry.aspx'

const FONG_SIP_CHEE_PERSON_ID = 18

export const PERSON_ID_TO_HAND_ALIAS_NOTE: Partial<
  Record<number, HandAliasNote>
> = {
  [FONG_SIP_CHEE_PERSON_ID]: {
    sittingDate: '1963-10-22',
    printedName: 'Mr Andrew Fong (Stamford)',
    sources: [
      {
        label: 'Wikipedia, Fong Sip Chee',
        url: 'https://en.wikipedia.org/wiki/Fong_Sip_Chee',
      },
      {
        label: 'Wikipedia, 3rd Legislative Assembly of Singapore',
        url: 'https://en.wikipedia.org/wiki/3rd_Legislative_Assembly_of_Singapore',
      },
    ],
  },
}
