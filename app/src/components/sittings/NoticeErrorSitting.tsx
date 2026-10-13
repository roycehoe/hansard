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
      description="The sitting did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
