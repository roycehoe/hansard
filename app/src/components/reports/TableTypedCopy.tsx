import type { TypedTableData } from '@/api/reports/getReport'
import { TextTypedCopy } from '@/components/reports/TextTypedCopy'
import {
  getNumericColumns,
  mergeHeaderRows,
  type MergedHeaderCell,
} from '@/lib/typedTable'
import { cn } from '@/lib/utils'
import { useId } from 'react'

interface TableTypedCopyProps {
  table: TypedTableData
}

const CELL_CLASS_NAME =
  'border-separator border-b px-2 py-2 text-left align-bottom'
const STUB_CLASS_NAME =
  'border-separator sticky left-0 z-10 max-w-32 min-w-18 border-r'
const GROUP_BORDER_CLASS_NAME = 'border-separator border-l'

export function TableTypedCopy({ table }: TableTypedCopyProps) {
  const captionId = useId()
  const header = mergeHeaderRows(table.header_rows)
  const isNumericColumn = getNumericColumns(table.body_rows)
  const lastBodyRowIndex = table.body_rows.length - 1

  function renderHeaderCell(cell: MergedHeaderCell) {
    const isGroup = cell.colSpan > 1
    const isLeaf = cell.columnIndex > 0 && !isGroup
    return (
      <th
        key={cell.columnIndex}
        scope={isGroup ? 'colgroup' : 'col'}
        colSpan={cell.colSpan}
        rowSpan={cell.rowSpan}
        className={cn(
          CELL_CLASS_NAME,
          'bg-muted text-muted-foreground font-medium',
          cell.columnIndex === 0 && cell.colSpan === 1 && STUB_CLASS_NAME,
          isGroup && 'text-center align-middle',
          isLeaf && isNumericColumn[cell.columnIndex] && 'min-w-22 text-right',
          header.groupStartColumns.includes(cell.columnIndex) &&
            GROUP_BORDER_CLASS_NAME
        )}
      >
        <TextTypedCopy text={cell.text} />
      </th>
    )
  }

  function renderBodyRow(row: string[], rowIndex: number) {
    const rowClassName = rowIndex === lastBodyRowIndex && 'border-b-0'
    return (
      <tr key={rowIndex}>
        {row.map((text, columnIndex) => {
          const cellClassName = cn(
            CELL_CLASS_NAME,
            rowClassName,
            header.groupStartColumns.includes(columnIndex) &&
              GROUP_BORDER_CLASS_NAME
          )
          if (columnIndex === 0) {
            return (
              <th
                key={columnIndex}
                scope="row"
                className={cn(
                  cellClassName,
                  STUB_CLASS_NAME,
                  'bg-background font-normal'
                )}
              >
                <TextTypedCopy text={text} />
              </th>
            )
          }
          return (
            <td
              key={columnIndex}
              className={cn(
                cellClassName,
                'whitespace-nowrap',
                isNumericColumn[columnIndex] && 'text-right'
              )}
            >
              <TextTypedCopy text={text} />
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <>
      {table.caption !== '' && (
        <p
          id={captionId}
          className="mt-3 text-sm leading-5 font-semibold first:mt-0"
        >
          <TextTypedCopy text={table.caption} />
        </p>
      )}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={table.caption === '' ? undefined : captionId}
        aria-label={table.caption === '' ? 'Table' : undefined}
        className="mt-2 overflow-x-auto"
      >
        <table
          aria-labelledby={table.caption === '' ? undefined : captionId}
          className="border-separate border-spacing-0 text-sm leading-5 tabular-nums"
        >
          {header.rows.length > 0 && (
            <thead>
              {header.rows.map((cells, rowIndex) => (
                <tr key={rowIndex}>{cells.map(renderHeaderCell)}</tr>
              ))}
            </thead>
          )}
          <tbody>{table.body_rows.map(renderBodyRow)}</tbody>
        </table>
      </div>
      {table.notes.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 text-xs leading-5">
          {table.notes.map((note, index) => (
            <p key={index}>
              <TextTypedCopy text={note} />
            </p>
          ))}
        </div>
      )}
    </>
  )
}
