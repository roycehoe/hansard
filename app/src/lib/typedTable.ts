import { splitSuperscripts } from '@/lib/typedSuperscript'

export interface MergedHeaderCell {
  text: string
  columnIndex: number
  colSpan: number
  rowSpan: number
}

export interface MergedHeader {
  rows: MergedHeaderCell[][]
  groupStartColumns: number[]
}

const FIRST_GROUP_BORDER_COLUMN = 2

export function mergeHeaderRows(headerRows: string[][]): MergedHeader {
  const isCovered = headerRows.map((row) => row.map(() => false))
  const rows: MergedHeaderCell[][] = headerRows.map(() => [])
  const groupStartColumns = new Set<number>()

  headerRows.forEach((row, rowIndex) => {
    row.forEach((text, columnIndex) => {
      if (isCovered[rowIndex][columnIndex]) return
      let colSpan = 1
      while (
        row[columnIndex + colSpan] === text &&
        !isCovered[rowIndex][columnIndex + colSpan]
      ) {
        colSpan++
      }
      let rowSpan = 1
      while (
        headerRows[rowIndex + rowSpan] !== undefined &&
        Array.from({ length: colSpan }).every(
          (_, offset) =>
            headerRows[rowIndex + rowSpan][columnIndex + offset] === text
        )
      ) {
        rowSpan++
      }
      for (let r = rowIndex; r < rowIndex + rowSpan; r++) {
        for (let c = columnIndex; c < columnIndex + colSpan; c++) {
          isCovered[r][c] = true
        }
      }
      rows[rowIndex].push({ text, columnIndex, colSpan, rowSpan })
      if (colSpan > 1 && columnIndex >= FIRST_GROUP_BORDER_COLUMN) {
        groupStartColumns.add(columnIndex)
      }
    })
  })
  return { rows, groupStartColumns: [...groupStartColumns] }
}

const NUMBER_PATTERN = /^[-+−–(]?(?:S?\$)?\d[\d,]*(?:\.\d+)?%?\)?$/
const YEAR_PATTERN = /^\d{4}$/
const PLACEHOLDER_PATTERN = /^(?:-|–|—|nil|n\.?a\.?)$/i

function stripSuperscripts(text: string): string {
  return splitSuperscripts(text)
    .filter((segment) => !segment.isSuperscript)
    .map((segment) => segment.text)
    .join('')
    .trim()
}

export function isNumericText(text: string): boolean {
  return NUMBER_PATTERN.test(stripSuperscripts(text))
}

export function getNumericColumns(bodyRows: string[][]): boolean[] {
  const columnCount = Math.max(0, ...bodyRows.map((row) => row.length))
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    if (columnIndex === 0) return false
    const cells = bodyRows
      .map((row) => stripSuperscripts(row[columnIndex] ?? ''))
      .filter((text) => text !== '' && !PLACEHOLDER_PATTERN.test(text))
    const numberCount = cells.filter((text) => NUMBER_PATTERN.test(text)).length
    const isYearColumn =
      cells.length > 0 && cells.every((text) => YEAR_PATTERN.test(text))
    return numberCount > 0 && numberCount * 2 >= cells.length && !isYearColumn
  })
}
