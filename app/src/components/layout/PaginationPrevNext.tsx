import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface PaginationPrevNextProps {
  page: number
  hasNextPage: boolean
  onPageChange: (page: number) => void
  ariaLabel: string
}

export function PaginationPrevNext({
  page,
  hasNextPage,
  onPageChange,
  ariaLabel,
}: PaginationPrevNextProps) {
  function goToPreviousPage() {
    onPageChange(page - 1)
  }

  function goToNextPage() {
    onPageChange(page + 1)
  }

  return (
    <Pagination aria-label={ariaLabel}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page === 1}
            onClick={goToPreviousPage}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext disabled={!hasNextPage} onClick={goToNextPage} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
