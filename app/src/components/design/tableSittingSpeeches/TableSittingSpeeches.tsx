import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReactTable, SortDirection } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react'

import type { features, SittingSpeech } from './useTableColumnsSittingSpeeches'

const SORT_LABELS: Record<
  SortDirection | 'none',
  'ascending' | 'descending' | 'none'
> = {
  asc: 'ascending',
  desc: 'descending',
  none: 'none',
}

const SORT_ICONS: Record<SortDirection | 'none', LucideIcon> = {
  asc: ArrowUp,
  desc: ArrowDown,
  none: ArrowUpDown,
}

interface TableSittingSpeechesProps {
  caption: string
  table: ReactTable<typeof features, SittingSpeech>
}

export function TableSittingSpeeches({
  caption,
  table,
}: TableSittingSpeechesProps) {
  return (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-muted">
            {headerGroup.headers.map((header) => {
              const sorted = header.column.getIsSorted() || 'none'
              const SortIcon = SORT_ICONS[sorted]
              return (
                <TableHead key={header.id} aria-sort={SORT_LABELS[sorted]}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={header} />
                    <SortIcon aria-hidden />
                  </Button>
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow className="bg-background text-foreground hover:bg-background border-none">
            <TableCell
              colSpan={table.getAllColumns().length}
              className="border-none py-[15px] text-center"
            >
              No Results.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="border-separator bg-background h-12 border-b py-4 last:border-b-0"
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
