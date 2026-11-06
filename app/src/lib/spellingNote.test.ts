import { splitSpellingNote } from '@/lib/spellingNote'
import { describe, expect, it } from 'vitest'

describe('splitSpellingNote', () => {
  it('keeps the text around each link in order', () => {
    expect(
      splitSpellingNote(
        "Printed by [Parliament](https://www.parliament.gov.sg/list)'s member list and [one line](/reports/00069147-ZZ_1#id030-bill)."
      )
    ).toEqual([
      { text: 'Printed by ' },
      { text: 'Parliament', url: 'https://www.parliament.gov.sg/list' },
      { text: "'s member list and " },
      { text: 'one line', url: '/reports/00069147-ZZ_1#id030-bill' },
      { text: '.' },
    ])
  })

  it('returns one text segment for a note with no link', () => {
    expect(splitSpellingNote('A sentence.')).toEqual([{ text: 'A sentence.' }])
  })
})
