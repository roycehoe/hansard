import {
  useTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

import { TablePaginationSittingSpeeches } from './TablePaginationSittingSpeeches'
import { TableSittingSpeeches } from './TableSittingSpeeches'
import {
  columns,
  features,
  type SittingSpeech,
} from './useTableColumnsSittingSpeeches'

interface TableIndexSittingSpeechesProps {
  caption: string
  data: SittingSpeech[]
}

export function TableIndexSittingSpeeches({
  caption,
  data,
}: TableIndexSittingSpeechesProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.id,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col items-center justify-center">
        <TableSittingSpeeches caption={caption} table={table} />
      </div>
      <TablePaginationSittingSpeeches
        pageCount={table.getPageCount()}
        pageIndex={table.state.pagination.pageIndex}
        onPageChange={table.setPageIndex}
      />
    </div>
  )
}
