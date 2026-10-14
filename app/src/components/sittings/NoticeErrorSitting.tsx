import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorSittingProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorSitting({
  onRetry,
  isRetrying,
}: NoticeErrorSittingProps) {
  return (
    <NoticeError
      title="Couldn't load the sitting"
      description="The sitting did not load. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
