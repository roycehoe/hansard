import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RotateCw, TriangleAlert } from 'lucide-react'

interface ErrorStateProps {
  title: string
  description: string
  onRetry: () => void
  isRetrying: boolean
}

export function ErrorState({
  title,
  description,
  onRetry,
  isRetrying,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-6 py-24 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <TriangleAlert
          size={40}
          aria-hidden="true"
          className="text-destructive"
        />
        <h2 className="text-destructive font-serif text-xl font-semibold">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-[420px] text-sm">
          {description}
        </p>
      </div>
      <Button disabled={isRetrying} onClick={onRetry}>
        {isRetrying ? (
          <>
            <Spinner />
            Retrying...
          </>
        ) : (
          <>
            <RotateCw />
            Try again
          </>
        )}
      </Button>
    </div>
  )
}
