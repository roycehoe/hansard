import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, RotateCw, TriangleAlert } from 'lucide-react'

interface NoticeErrorProps {
  title: string
  description: string
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeError({
  title,
  description,
  onRetry,
  isRetrying,
}: NoticeErrorProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-12 py-24"
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <TriangleAlert
          size={40}
          aria-hidden="true"
          className="text-destructive"
        />
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground max-w-[420px] text-sm">
          {description}
        </p>
      </div>
      <div className="flex flex-row items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/">
            <ChevronLeft />
            Back to Home
          </Link>
        </Button>
        <Button variant="default" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? (
            <>
              <Spinner />
              Retrying...
            </>
          ) : (
            <>
              <RotateCw />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
