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
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
