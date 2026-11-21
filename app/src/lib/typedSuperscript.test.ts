import { splitSuperscripts } from '@/lib/typedSuperscript'
import { describe, expect, it } from 'vitest'

const PLAIN = false
const SUP = true

describe('splitSuperscripts', () => {
  it('turns ^[X] into a superscript', () => {
    expect(splitSuperscripts('Total^[a, b] here')).toEqual([
      { text: 'Total', isSuperscript: PLAIN },
      { text: 'a, b', isSuperscript: SUP },
      { text: ' here', isSuperscript: PLAIN },
    ])
  })

  it('takes one mark after the caret', () => {
    expect(splitSuperscripts('^*The')).toEqual([
      { text: '*', isSuperscript: SUP },
      { text: 'The', isSuperscript: PLAIN },
    ])
    expect(splitSuperscripts('Resident Marriages^#')).toEqual([
      { text: 'Resident Marriages', isSuperscript: PLAIN },
      { text: '#', isSuperscript: SUP },
    ])
  })

  it('takes a caret as the mark in ^^', () => {
    expect(splitSuperscripts('2020^^')).toEqual([
      { text: '2020', isSuperscript: PLAIN },
      { text: '^', isSuperscript: SUP },
    ])
  })

  it('takes one to three letters or digits', () => {
    expect(splitSuperscripts('10^th')).toEqual([
      { text: '10', isSuperscript: PLAIN },
      { text: 'th', isSuperscript: SUP },
    ])
    expect(splitSuperscripts('166^1')).toEqual([
      { text: '166', isSuperscript: PLAIN },
      { text: '1', isSuperscript: SUP },
    ])
    expect(splitSuperscripts('^1 Figures')).toEqual([
      { text: '1', isSuperscript: SUP },
      { text: ' Figures', isSuperscript: PLAIN },
    ])
    expect(splitSuperscripts('^P:')).toEqual([
      { text: 'P', isSuperscript: SUP },
      { text: ':', isSuperscript: PLAIN },
    ])
  })

  it('keeps any other caret literal', () => {
    expect(splitSuperscripts('6.6%^')).toEqual([
      { text: '6.6%^', isSuperscript: PLAIN },
    ])
    expect(splitSuperscripts('^Applicants')).toEqual([
      { text: '^Applicants', isSuperscript: PLAIN },
    ])
  })

  it('returns no segments for an empty string', () => {
    expect(splitSuperscripts('')).toEqual([])
  })
})
