import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { MouseEvent } from 'react'

interface TablePaginationSittingSpeechesProps {
  pageCount: number
  pageIndex: number
  onPageChange: (pageIndex: number) => void
}

export function TablePaginationSittingSpeeches({
  pageCount,
  pageIndex,
  onPageChange,
}: TablePaginationSittingSpeechesProps) {
  function goToPreviousPage() {
    onPageChange(pageIndex - 1)
  }

  function goToNextPage() {
    onPageChange(pageIndex + 1)
  }

  function goToPage(event: MouseEvent<HTMLButtonElement>) {
    onPageChange(Number(event.currentTarget.dataset.pageIndex))
  }

  return pageCount <= 1 ? null : (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={pageIndex === 0}
            onClick={goToPreviousPage}
          />
        </PaginationItem>
        {Array.from({ length: pageCount }, (_, index) => (
          <PaginationItem key={index}>
            <PaginationLink
              aria-label={`Go to page ${index + 1}`}
              data-page-index={index}
              isActive={index === pageIndex}
              onClick={goToPage}
            >
              {index + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={pageIndex === pageCount - 1}
            onClick={goToNextPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
