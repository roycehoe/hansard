import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RotateCw, TriangleAlert } from 'lucide-react'

interface NoticeErrorLoadMoreProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorLoadMore({
  onRetry,
  isRetrying,
}: NoticeErrorLoadMoreProps) {
  return (
    <div className="border-separator flex flex-wrap items-center gap-4 border-t py-4">
      <div className="flex flex-row gap-4">
        <TriangleAlert className="text-destructive" />
        <p className="text-destructive">More results did not load.</p>
      </div>
      <Button variant="outline" disabled={isRetrying} onClick={onRetry}>
        {isRetrying ? (
          <>
            <Spinner />
            Retrying…
          </>
        ) : (
          <>
            <RotateCw className="h-4 w-4" />
            Try again
          </>
        )}
      </Button>
    </div>
  )
}
