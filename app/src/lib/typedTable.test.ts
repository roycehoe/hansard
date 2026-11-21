import {
  getNumericColumns,
  isNumericText,
  mergeHeaderRows,
} from '@/lib/typedTable'
import { describe, expect, it } from 'vitest'

const HFMD_HEADER = [
  ['Age (years)', '2010', '2010', '2011', '2011', '2012', '2012'],
  [
    'Age (years)',
    'No of cases',
    'Percentage among all cases',
    'No of cases',
    'Percentage among all cases',
    'No of cases',
    'Percentage among all cases',
  ],
]

const MARRIAGES_HEADER = [
  [
    'Highest Qualification Attained (By Groom)',
    'Marriages in 2007',
    'Marriages in 2007',
    'Marriages in 2007',
    'Marriages in 2007',
    'Marriages in 2007',
    'Marriages in 2007',
  ],
  [
    'Highest Qualification Attained (By Groom)',
    'Resident Marriages^#',
    'Resident Marriages^#',
    'Resident Marriages^#',
    'SC-NR Marriages',
    'SC-NR Marriages',
    'SC-NR Marriages',
  ],
  [
    'Highest Qualification Attained (By Groom)',
    'No. of marriages',
    'Cumulative no. of dissolutions * before 5th anniversary',
    'Cumulative dissolution rate before 5th anniversary * (%)',
    'No. of marriages',
    'Cumulative no. of dissolutions * before 5th anniversary',
    'Cumulative dissolution rate before 5th anniversary * (%)',
  ],
]

function describeCells(header: string[][]): string[][] {
  return mergeHeaderRows(header).rows.map((row) =>
    row.map(
      (cell) =>
        `${cell.text}@${cell.columnIndex}:${cell.colSpan}x${cell.rowSpan}`
    )
  )
}

describe('mergeHeaderRows', () => {
  it('merges the written answer 1464 header', () => {
    expect(describeCells(HFMD_HEADER)).toEqual([
      ['Age (years)@0:1x2', '2010@1:2x1', '2011@3:2x1', '2012@5:2x1'],
      [
        'No of cases@1:1x1',
        'Percentage among all cases@2:1x1',
        'No of cases@3:1x1',
        'Percentage among all cases@4:1x1',
        'No of cases@5:1x1',
        'Percentage among all cases@6:1x1',
      ],
    ])
  })

  it('merges the written answer 3157 header', () => {
    const rows = describeCells(MARRIAGES_HEADER)
    expect(rows[0]).toEqual([
      'Highest Qualification Attained (By Groom)@0:1x3',
      'Marriages in 2007@1:6x1',
    ])
    expect(rows[1]).toEqual([
      'Resident Marriages^#@1:3x1',
      'SC-NR Marriages@4:3x1',
    ])
    expect(rows[2]).toHaveLength(6)
  })

  it('starts a group border where a spanning cell begins past the first data column', () => {
    expect(mergeHeaderRows(HFMD_HEADER).groupStartColumns).toEqual([3, 5])
    expect(mergeHeaderRows(MARRIAGES_HEADER).groupStartColumns).toEqual([4])
  })

  it('leaves a single header row of different cells unmerged', () => {
    expect(describeCells([['Year', '2020', '2021']])).toEqual([
      ['Year@0:1x1', '2020@1:1x1', '2021@2:1x1'],
    ])
  })

  it('returns nothing for no header rows', () => {
    expect(mergeHeaderRows([])).toEqual({ rows: [], groupStartColumns: [] })
  })
})

describe('isNumericText', () => {
  it('accepts counts, shares and money', () => {
    for (const text of ['5921', '23,404', '19.2%', '-3', '(12)', '$1,200']) {
      expect(isNumericText(text)).toBe(true)
    }
  })

  it('ignores a superscript mark', () => {
    expect(isNumericText('166^1')).toBe(true)
  })

  it('rejects words and mixed text', () => {
    for (const text of ['Total', '0-1', '2 to 3', '']) {
      expect(isNumericText(text)).toBe(false)
    }
  })
})

describe('getNumericColumns', () => {
  it('marks a column numeric when most filled cells are numbers', () => {
    expect(
      getNumericColumns([
        ['Total', '1,581', 'Yes', '-'],
        ['Secondary', '596', 'No', '12'],
      ])
    ).toEqual([false, true, false, true])
  })

  it('never marks the row header column', () => {
    expect(getNumericColumns([['2020', '5']])).toEqual([false, true])
  })
})
