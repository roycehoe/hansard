import {
  buildPagePermalink,
  buildReportCitation,
  buildReportCite,
  buildReportPermalink,
  buildSpeechCitation,
  buildSpeechCite,
  buildSpeechPermalink,
  parseSpeakerLabel,
} from '@/lib/citation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SITE_ORIGIN = 'https://hansard.example'
const PARLIAMENT_TITLE = 'Singapore Parliamentary Debates, Official Report'
const LEGISLATIVE_ASSEMBLY_TITLE =
  'Singapore Legislative Assembly Debates, Official Report'

beforeEach(() => {
  vi.stubGlobal('window', { location: { origin: SITE_ORIGIN } })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseSpeakerLabel', () => {
  it('reads a plain member label', () => {
    expect(parseSpeakerLabel('Mr Lee Hsien Loong', '')).toEqual({
      name: 'Mr Lee Hsien Loong',
      office: '',
    })
  })

  it('removes full stops from a member name', () => {
    expect(parseSpeakerLabel('Dr. Tan Wu Meng', '')).toEqual({
      name: 'Dr Tan Wu Meng',
      office: '',
    })
  })

  it('reads a minister label as office and name', () => {
    expect(
      parseSpeakerLabel('The Minister for Finance (Mr Lawrence Wong)', '')
    ).toEqual({ name: 'Mr Lawrence Wong', office: 'Minister for Finance' })
  })

  it('drops the The from an office with no name bracket', () => {
    expect(parseSpeakerLabel('The Chairman', '')).toEqual({
      name: '',
      office: 'Chairman',
    })
  })

  it('reads a presiding officer label with a name', () => {
    expect(
      parseSpeakerLabel('Mr Deputy Speaker (Mr Charles Chong)', '')
    ).toEqual({ name: 'Mr Charles Chong', office: 'Mr Deputy Speaker' })
  })

  it('keeps a presiding officer label with no name as the office', () => {
    expect(parseSpeakerLabel('Mr Speaker', '')).toEqual({
      name: '',
      office: 'Mr Speaker',
    })
    expect(parseSpeakerLabel('Madam Speaker', '')).toEqual({
      name: '',
      office: 'Madam Speaker',
    })
  })

  it('reads the presiding office from a bracket after a member name', () => {
    expect(parseSpeakerLabel('Mr Lim Biow Chuan (Deputy Speaker)', '')).toEqual(
      {
        name: 'Mr Lim Biow Chuan',
        office: 'Deputy Speaker',
      }
    )
  })

  it('ignores other brackets after a member name', () => {
    expect(parseSpeakerLabel('Mr Lee Li Lian (Punggol East)', '')).toEqual({
      name: 'Mr Lee Li Lian',
      office: '',
    })
  })

  it('drops an acting-for bracket that follows the name', () => {
    expect(
      parseSpeakerLabel(
        'The Minister of State for Finance (Ms Indranee Rajah) (for the Minister for Finance)',
        ''
      )
    ).toEqual({
      name: 'Ms Indranee Rajah',
      office: 'Minister of State for Finance',
    })
  })

  it('drops an acting-for bracket that sits before the name', () => {
    expect(
      parseSpeakerLabel(
        'The Minister for Law (for the Minister for Home Affairs) (Mr K Shanmugam)',
        ''
      )
    ).toEqual({ name: 'Mr K Shanmugam', office: 'Minister for Law' })
  })

  it('drops an acting-for bracket nested inside the name bracket', () => {
    expect(
      parseSpeakerLabel(
        'The Minister for Transport (Mr Khaw Boon Wan (for the Minister for Finance))',
        ''
      )
    ).toEqual({ name: 'Mr Khaw Boon Wan', office: 'Minister for Transport' })
  })

  it('drops an on behalf of bracket', () => {
    expect(
      parseSpeakerLabel(
        'The Minister for Health (Mr Ong Ye Kung (on behalf of the Prime Minister))',
        ''
      )
    ).toEqual({ name: 'Mr Ong Ye Kung', office: 'Minister for Health' })
  })

  it('uses the stored name when an office label has a bracket but no name', () => {
    expect(
      parseSpeakerLabel('The Minister for Health (Acting)', 'Ong Ye Kung')
    ).toEqual({ name: 'Ong Ye Kung', office: 'Minister for Health (Acting)' })
  })

  it('ignores a stored name in Surname, Given form', () => {
    expect(
      parseSpeakerLabel('The Minister for Health (Acting)', 'Ong, Ye Kung')
    ).toEqual({ name: '', office: 'Minister for Health (Acting)' })
  })

  it('does not use the stored name for an office with no bracket', () => {
    expect(parseSpeakerLabel('The Chairman', 'Lee Bee Wah')).toEqual({
      name: '',
      office: 'Chairman',
    })
  })

  it('reads a bracket that is never closed', () => {
    expect(
      parseSpeakerLabel('The Minister for Health (Mr Ong Ye Kung', '')
    ).toEqual({ name: 'Mr Ong Ye Kung', office: 'Minister for Health' })
  })

  it('returns empty parts for an empty label', () => {
    expect(parseSpeakerLabel('', '')).toEqual({ name: '', office: '' })
  })
})

describe('buildReportCitation', () => {
  it('cites a Parliament report with date and volume', () => {
    expect(buildReportCitation('2023-02-14', 3, 14)).toBe(
      `${PARLIAMENT_TITLE} (14 February 2023) vol 3`
    )
  })

  it('cites a Legislative Assembly report with its own title', () => {
    expect(buildReportCitation('1957-09-12', 7, 0)).toBe(
      `${LEGISLATIVE_ASSEMBLY_TITLE} (12 September 1957) vol 7`
    )
  })

  it('uses the Parliament title for every Parliament number above 0', () => {
    expect(buildReportCitation('1970-01-01', 1, 1)).toContain(PARLIAMENT_TITLE)
  })
})

describe('permalinks', () => {
  it('builds a report permalink from the site origin', () => {
    expect(buildReportPermalink('2023-02-14-budget')).toBe(
      `${SITE_ORIGIN}/reports/2023-02-14-budget`
    )
  })

  it('encodes characters in a report slug', () => {
    expect(buildReportPermalink('a b/c?d')).toBe(
      `${SITE_ORIGIN}/reports/a%20b%2Fc%3Fd`
    )
  })

  it('builds a page permalink from a path', () => {
    expect(buildPagePermalink('/people/12-lee')).toBe(
      `${SITE_ORIGIN}/people/12-lee`
    )
  })

  it('links a speech by ordinal fragment when there is no anchor', () => {
    expect(buildSpeechPermalink('2023-02-14-budget', 5, '')).toBe(
      `${SITE_ORIGIN}/reports/2023-02-14-budget#s5`
    )
  })

  it('links a speech by ordinal and anchor text', () => {
    expect(buildSpeechPermalink('2023-02-14-budget', 5, 'housing grants')).toBe(
      `${SITE_ORIGIN}/reports/2023-02-14-budget?s=5&q=housing+grants`
    )
  })

  it('encodes reserved characters in the anchor text', () => {
    expect(buildSpeechPermalink('r', 1, 'a&b=c#d')).toBe(
      `${SITE_ORIGIN}/reports/r?s=1&q=a%26b%3Dc%23d`
    )
  })
})

describe('buildSpeechCitation', () => {
  it('adds name and office to the report citation', () => {
    expect(
      buildSpeechCitation(
        '2023-02-14',
        3,
        14,
        null,
        'The Minister for Finance (Mr Lawrence Wong)',
        ''
      )
    ).toBe(
      `${PARLIAMENT_TITLE} (14 February 2023) vol 3 (Mr Lawrence Wong, Minister for Finance)`
    )
  })

  it('shows only the name for a member with no office', () => {
    expect(
      buildSpeechCitation('2023-02-14', 3, 14, null, 'Mr Leon Perera', '')
    ).toBe(`${PARLIAMENT_TITLE} (14 February 2023) vol 3 (Mr Leon Perera)`)
  })

  it('shows only the office when the label has no name', () => {
    expect(
      buildSpeechCitation('2023-02-14', 3, 14, null, 'Mr Speaker', '')
    ).toBe(`${PARLIAMENT_TITLE} (14 February 2023) vol 3 (Mr Speaker)`)
  })

  it('adds the column after the volume where the row has one', () => {
    expect(
      buildSpeechCitation('2009-05-29', 86, 11, 698, 'Mr Seah Kian Peng', '')
    ).toBe(
      `${PARLIAMENT_TITLE} (29 May 2009) vol 86 at col 698 (Mr Seah Kian Peng)`
    )
  })

  it('cites the column a Legislative Assembly row prints', () => {
    expect(
      buildSpeechCitation('1957-09-12', 3, 0, 1205, 'Mr Lim Yew Hock', '')
    ).toBe(
      `${LEGISLATIVE_ASSEMBLY_TITLE} (12 September 1957) vol 3 at col 1205 (Mr Lim Yew Hock)`
    )
  })
})

describe('buildSpeechCite', () => {
  it('puts title, citation, permalink, date and original in order', () => {
    expect(
      buildSpeechCite(
        'CITATION',
        'Budget Debate',
        'https://hansard.example/reports/x#s5',
        'https://sprs.parl.gov.sg/x',
        '1 March 2026'
      )
    ).toBe(
      '"Budget Debate", CITATION. Retrieved from https://hansard.example/reports/x#s5 on 1 March 2026. Original: https://sprs.parl.gov.sg/x'
    )
  })
})

describe('citation titles with double quotes', () => {
  it('uses single quotes inside the wrapping quotes', () => {
    const title = 'Motion on "Dignity" Bill'
    const expected = `"Motion on 'Dignity' Bill", CITATION.`
    expect(buildSpeechCite('CITATION', title, 'p', 'o', 'd')).toContain(
      expected
    )
    expect(buildReportCite('CITATION', title, 'x', 'o', 'd')).toContain(
      expected
    )
  })
})

describe('buildReportCite', () => {
  it('builds the permalink from the slug', () => {
    expect(
      buildReportCite(
        'CITATION',
        'Budget Debate',
        'x',
        'https://sprs.parl.gov.sg/x',
        '1 March 2026'
      )
    ).toBe(
      `"Budget Debate", CITATION. Retrieved from ${SITE_ORIGIN}/reports/x on 1 March 2026. Original: https://sprs.parl.gov.sg/x`
    )
  })
})
